extends "res://tests/check_rig.gd"
## Independent clip observer. Source scenes and animations are never saved.
var manifest: Dictionary
var subject: Dictionary
var clip_observed: Dictionary = {}

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() != 2 or args[0] not in ["observe", "render"]:
		push_error("expected observe/render and capture directory")
		quit(2)
		return
	output = args[1]
	manifest = JSON.parse_string(FileAccess.get_file_as_string("res://body_parts.yml"))
	subject = JSON.parse_string(FileAccess.get_file_as_string("res://parts.json"))
	spec = {"bones": manifest.joints}
	call_deferred("clip_run", args[0])

func save_json(filename: String, value: Variant) -> void:
	var file := FileAccess.open(output.path_join(filename), FileAccess.WRITE)
	if file == null:
		push_error("cannot write " + filename)
		quit(2)
		return
	file.store_string(JSON.stringify(value))
	file.close()

func reset_clip_rig(rig: Node2D) -> void:
	var player := rig.get_node("AnimationPlayer") as AnimationPlayer
	player.stop()
	rig.position = Vector2.ZERO
	for bone in rig.find_children("*", "Bone2D", true, false):
		bone.transform = bone.rest
	var flash := rig.find_child("MuzzleFlash", true, false) as Node2D
	if flash:
		flash.visible = false

func prepare_player(rig: Node2D) -> Dictionary:
	var player := rig.get_node_or_null("AnimationPlayer") as AnimationPlayer
	var errors: Dictionary = {}
	if player == null:
		return {"all": "missing AnimationPlayer"}
	player.stop()
	for clip in CLIPS:
		if not player.has_animation(clip):
			errors[clip] = "missing animation " + clip
			continue
		# Resource.duplicate produces a private copy. Replacing this instance's
		# library also avoids sharing modified animations between atlas rigs.
	var library := AnimationLibrary.new()
	for clip in CLIPS:
		if player.has_animation(clip):
			var animation := player.get_animation(clip).duplicate(true) as Animation
			animation.loop_mode = Animation.LOOP_NONE
			library.add_animation(clip, animation)
	for name_ in player.get_animation_library_list():
		player.remove_animation_library(name_)
	player.add_animation_library("", library)
	return errors

func sample_pose(rig: Node2D, clip: String, frame: int) -> Dictionary:
	reset_clip_rig(rig)
	var player := rig.get_node("AnimationPlayer") as AnimationPlayer
	if not player.has_animation(clip):
		return {"error": "missing animation " + clip}
	var animation := player.get_animation(clip)
	var time_: float = animation.length if frame == CLIPS[clip] else frame / FPS
	player.play(clip)
	player.pause()
	player.seek(time_, true)
	var angles: Dictionary = {}
	var positions: Dictionary = {}
	for joint in manifest.joints:
		var bone := rig.get_node_or_null(bone_path(joint.name)) as Bone2D
		if bone:
			angles[joint.name] = bone.rotation
			positions[joint.name] = [bone.position.x, bone.position.y]
	return {"time": time_, "angles": angles, "positions": positions}

func observe_clips(mode: String) -> void:
	var rig := make_rig(mode, root)
	var errors := prepare_player(rig)
	var scene_data: Dictionary = {}
	for clip in CLIPS:
		if errors.has("all") or errors.has(clip):
			scene_data[clip] = {"error": errors.get("all", errors.get(clip, ""))}
			continue
		var player := rig.get_node("AnimationPlayer") as AnimationPlayer
		var animation := player.get_animation(clip)
		var tracks: Array = []
		for index in animation.get_track_count():
			tracks.append({"path": str(animation.track_get_path(index)),
				"enabled": animation.track_is_enabled(index),
				"type": animation.track_get_type(index)})
		var samples: Array = []
		for frame in range(CLIPS[clip] + 1):
			samples.append(sample_pose(rig, clip, frame))
		scene_data[clip] = {"length": animation.length, "tracks": tracks, "samples": samples}
	clip_observed[mode] = scene_data
	rig.free()

func atlas_cell(view: SubViewport, size_: int, column: int, row: int) -> Control:
	var cell := Control.new()
	cell.position = Vector2(column * size_, row * size_)
	cell.size = Vector2(size_, size_)
	cell.clip_contents = true
	view.add_child(cell)
	return cell

func rig_bones(rig: Node2D) -> Dictionary:
	var transforms: Dictionary = {}
	for bone in rig.find_children("*", "Bone2D", true, false):
		transforms[str(bone.name)] = rig.global_transform.affine_inverse() * bone.global_transform
	return transforms

func render_clips(mode: String) -> Array:
	# Native units in both scenes; no HD conversion or camera zoom.
	var radius: int = 32 if mode == "hd" else 3
	var size_: int = radius * 2 + 8
	var view := SubViewport.new()
	view.size = Vector2i(size_ * subject.bones.size(), size_ * 3)
	view.disable_3d = true
	view.transparent_bg = true
	view.render_target_clear_mode = SubViewport.CLEAR_MODE_ALWAYS
	root.add_child(view)
	var seams: Array = []
	for index in subject.bones.size():
		var joint: Dictionary = subject.bones[index]
		var parent_cell := atlas_cell(view, size_, index, 0)
		var child_cell := atlas_cell(view, size_, index, 1)
		var actual_cell := atlas_cell(view, size_, index, 2)
		var background := ColorRect.new()
		background.color = Color(1, 0, 1, 1)
		background.size = Vector2(size_, size_)
		background.z_index = -4096
		actual_cell.add_child(background)
		var rig := make_rig(mode, actual_cell)
		var errors := prepare_player(rig)
		if not errors.is_empty():
			seams.append({"joint": joint.name, "error": str(errors)})
			continue
		reset_clip_rig(rig)
		var bone := rig.get_node_or_null(bone_path(joint.name)) as Bone2D
		if bone == null:
			seams.append({"joint": joint.name, "error": "missing joint or skeletal parent"})
			continue
		var refs: Array = []
		for sprite in rig.find_children("*", "Sprite2D", true, false):
			if sprite.get_parent() == bone or (joint.parent != null and sprite.get_parent() == bone.get_parent()):
				if sprite.texture == null:
					push_error("missing joint reference texture")
					quit(2)
					return []
				var native: Transform2D = rig.global_transform.affine_inverse() * sprite.global_transform
				var parent_sprite := sprite.duplicate() as Sprite2D
				var child_sprite := sprite.duplicate() as Sprite2D
				parent_cell.add_child(parent_sprite)
				child_cell.add_child(child_sprite)
				refs.append({"parent": parent_sprite, "child": child_sprite, "rest": native})
		seams.append({"rig": rig, "joint": joint.name, "parent": joint.parent,
			"rest_bones": rig_bones(rig), "refs": refs})
	var metadata: Array = []
	for clip in CLIPS:
		for frame in range(CLIPS[clip] + 1):
			var label: String = "end" if frame == CLIPS[clip] else "f%02d" % frame
			var entries: Array = []
			for seam in seams:
				if seam.has("error"):
					entries.append({"joint": seam.joint, "error": seam.error})
					continue
				var rig: Node2D = seam.rig
				var sampled := sample_pose(rig, clip, frame)
				if sampled.has("error"):
					entries.append({"joint": seam.joint, "error": sampled.error})
					continue
				var posed := rig_bones(rig)
				var child_delta: Transform2D = posed[seam.joint] * seam.rest_bones[seam.joint].affine_inverse()
				var parent_delta := Transform2D.IDENTITY
				if seam.parent != null:
					parent_delta = posed[seam.parent] * seam.rest_bones[seam.parent].affine_inverse()
				var current: Transform2D = posed[seam.joint]
				var crop := Transform2D(0, Vector2(size_ / 2.0, size_ / 2.0) - current.origin)
				for reference in seam.refs:
					reference.parent.transform = crop * parent_delta * reference.rest
					reference.child.transform = crop * child_delta * reference.rest
				rig.position = crop.origin
				entries.append({"joint": seam.joint, "root": seam.parent == null})
			var filename: String = "%s-%s-%s.png" % [mode, clip, label]
			await capture(view, filename)
			metadata.append({"scene": mode, "clip": clip, "sample": label,
				"radius": radius, "size": size_, "filename": filename, "joints": entries})
		print("CLIP capture ", mode, "/", clip, " complete")
	view.free()
	return metadata

func clip_run(mode: String) -> void:
	if mode == "observe":
		for scene in ["hd", "pixel"]:
			observe_clips(scene)
		save_json("clip-observed.json", clip_observed)
	else:
		var atlases: Array = []
		for scene in ["hd", "pixel"]:
			atlases.append_array(await render_clips(scene))
		save_json("clip-atlases.json", atlases)
	quit(0)
