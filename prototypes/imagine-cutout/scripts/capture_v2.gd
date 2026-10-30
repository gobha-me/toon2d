extends SceneTree
## Review-only HD captures. No acceptance assertions or production writes.
var manifest: Dictionary
var output: String

func _initialize() -> void:
	manifest = JSON.parse_string(FileAccess.get_file_as_string("res://body_parts.yml"))
	output = ProjectSettings.globalize_path("res://review")
	DirAccess.make_dir_recursive_absolute(output)
	call_deferred("capture")

func capture() -> void:
	RenderingServer.set_default_clear_color(Color("18202b"))
	var view := SubViewport.new()
	view.size = Vector2i(768, 896)
	view.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(view)
	var rig: Node2D = load("res://scenes/hd.tscn").instantiate()
	rig.process_mode = Node.PROCESS_MODE_DISABLED
	view.add_child(rig)
	var player: AnimationPlayer = rig.get_node("AnimationPlayer")
	for pose in ["rest", "aim", "fire", "knees"]:
		player.stop()
		for bone in rig.find_children("*", "Bone2D", true, false):
			bone.transform = bone.rest
		rig.find_child("MuzzleFlash", true, false).visible = false
		if pose in ["aim", "fire"]:
			player.play(pose)
			player.pause()
			player.seek(0.0 if pose == "fire" else player.get_animation(pose).length, true)
		elif pose == "knees":
			for joint in manifest.joints:
				if joint.name in ["knee_left", "knee_right", "left_fore"]:
					rig.find_child(joint.name, true, false).rotation_degrees = joint.rotation_limits_deg[1]
		await process_frame
		await RenderingServer.frame_post_draw
		var error := view.get_texture().get_image().save_png(output.path_join(pose + ".png"))
		if error != OK:
			quit(1)
			return
	print("Captured HD rest, aim, fire and manifest knee-limit review poses")
	quit()
