extends SceneTree
## Capture utility only: samples the authored clips and prescribed joint poses.
## This script contains no acceptance assertions about the rig.
const FPS := 24
var metadata: Dictionary
var output: String
var manifest: Dictionary = {"fps": FPS, "modes": {}}

func _initialize() -> void:
	metadata = JSON.parse_string(FileAccess.get_file_as_string("res://parts.json"))
	output = ProjectSettings.globalize_path("res://renders")
	call_deferred("capture_all")

func save_frame(view: SubViewport, path: String) -> void:
	DirAccess.make_dir_recursive_absolute(path.get_base_dir())
	var error := view.get_texture().get_image().save_png(path)
	if error != OK:
		push_error("Could not write " + path + ": " + str(error))
		quit(1)

func settle() -> void:
	await process_frame
	await RenderingServer.frame_post_draw

func snapshot(rig: Node2D, bones: Array[Node]) -> Dictionary:
	var gun: Sprite2D = rig.find_child("Gun", true, false)
	var flash: Node2D = rig.find_child("MuzzleFlash", true, false)
	var t := gun.global_transform
	var poses := {}
	for bone in bones:
		poses[bone.name] = {"rotation_degrees": bone.rotation_degrees,
			"position": [bone.position.x, bone.position.y],
			"global_position": [bone.global_position.x, bone.global_position.y]}
	return {"flash_visible": flash.visible,
		"gun_global_transform": [t.x.x,t.x.y,t.y.x,t.y.y,t.origin.x,t.origin.y],
		"gun_scale": [gun.scale.x,gun.scale.y], "gun_skew": gun.skew,
		"gun_texture": gun.texture.resource_path, "bones": poses}

func capture_all() -> void:
	RenderingServer.set_default_clear_color(Color("18202b"))
	for mode in ["hd", "pixel"]:
		var view := SubViewport.new()
		view.size = Vector2i(128,144) if mode == "pixel" else Vector2i(768,896)
		view.snap_2d_transforms_to_pixel = mode == "pixel"
		view.snap_2d_vertices_to_pixel = false
		view.render_target_update_mode = SubViewport.UPDATE_ALWAYS
		root.add_child(view)
		var close_view := SubViewport.new()
		close_view.size = Vector2i(32,32) if mode == "pixel" else Vector2i(200,200)
		close_view.world_2d = view.world_2d
		close_view.transparent_bg = true
		close_view.snap_2d_transforms_to_pixel = mode == "pixel"
		close_view.snap_2d_vertices_to_pixel = false
		close_view.render_target_update_mode = SubViewport.UPDATE_ALWAYS
		root.add_child(close_view)
		var rig: Node2D = load("res://scenes/" + mode + ".tscn").instantiate()
		view.add_child(rig)
		var player: AnimationPlayer = rig.get_node("AnimationPlayer")
		player.callback_mode_process = AnimationMixer.ANIMATION_CALLBACK_MODE_PROCESS_MANUAL
		var bones := rig.find_children("*", "Bone2D", true, false)
		var records := {"animations": {}, "joint_extremes": []}
		await settle()
		for clip in ["idle", "aim", "fire", "cooldown"]:
			var animation := player.get_animation(clip)
			var frame_count := roundi(animation.length * FPS)
			var frames: Array = []
			player.play(clip)
			player.advance(0)
			for frame in range(frame_count):
				player.seek(float(frame)/FPS, true)
				await settle()
				var path: String = mode + "/" + clip + "/%03d.png" % frame
				save_frame(view,output+"/"+path)
				var record := snapshot(rig,bones)
				record.merge({"frame":frame,"time":float(frame)/FPS,"path":path})
				frames.append(record)
			# Endpoint is a separate key-pose, not an extra playback frame.
			player.seek(animation.length, true)
			await settle()
			save_frame(view,output+"/"+mode+"/keyposes/"+clip+"_end.png")
			records.animations[clip] = {"duration":animation.length,"frames":frames}
			print("Captured ",mode," / ",clip," / ",frame_count," frames at 24 fps")
		player.stop()
		for joint in metadata.bones:
			for side in range(2):
				for bone in bones:
					bone.rotation = 0
					if bone.name == "hip":
						bone.position = Vector2(joint_pivot("hip")[0],joint_pivot("hip")[1])
				rig.find_child("MuzzleFlash",true,false).visible = false
				var target: Bone2D = rig.find_child(joint.name,true,false)
				target.rotation_degrees = joint.rotation_limits_deg[side]
				# Shared world, independent 1:1 camera transform: genuine source-pixel
				# detail around the current pivot, not a crop of the zoomed-out view.
				close_view.canvas_transform = Transform2D(0.0,Vector2(close_view.size)*.5-target.global_position)
				await settle()
				var path: String = mode+"/joint_extremes/"+joint.name+("_min.png" if side==0 else "_max.png")
				save_frame(view,output+"/"+path)
				var close_path: String = mode+"/joint_closeups/"+joint.name+("_min.png" if side==0 else "_max.png")
				save_frame(close_view,output+"/"+close_path)
				var record := snapshot(rig,bones)
				record.merge({"joint":joint.name,"side":"min" if side==0 else "max","degrees":joint.rotation_limits_deg[side],"path":path,
					"closeup_path":close_path,"closeup_source_size":[close_view.size.x,close_view.size.y],
					"closeup_pivot_world":[target.global_position.x,target.global_position.y]})
				records.joint_extremes.append(record)
		manifest.modes[mode] = records
		view.queue_free()
		close_view.queue_free()
		await process_frame
	var file := FileAccess.open(output+"/manifest.json",FileAccess.WRITE)
	file.store_string(JSON.stringify(manifest,"  ")+"\n")
	file.close()
	quit()

func joint_pivot(name: String) -> Array:
	for bone in metadata.bones:
		if bone.name == name:
			if metadata.pixel_scale and manifest.modes.has("hd"):
				return [round(bone.pivot[0]*metadata.pixel_scale), round(bone.pivot[1]*metadata.pixel_scale)]
			return bone.pivot
	return [0,0]
