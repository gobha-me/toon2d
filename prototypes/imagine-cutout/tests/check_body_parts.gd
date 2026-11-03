extends "res://tests/check_rig.gd"
## Test observer only: never saves a scene, bone, animation or production asset.
const TILE := 72
var manifest: Dictionary
var subject: Dictionary
var observations := {"completeness": [], "facing": [], "facing_samples": []}

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	output = args[1]
	manifest = JSON.parse_string(FileAccess.get_file_as_string("res://body_parts.yml"))
	subject = JSON.parse_string(FileAccess.get_file_as_string("res://parts.json"))
	spec = {"bones": manifest.joints}
	call_deferred("body_run", args[0])

func write_json(name_: String, value: Variant) -> void:
	var file := FileAccess.open(output.path_join(name_), FileAccess.WRITE)
	file.store_string(JSON.stringify(value, "\t"))
	file.close()

func rest_all(rig: Node2D) -> void:
	var player := rig.get_node_or_null("AnimationPlayer") as AnimationPlayer
	if player:
		player.stop()
	for node in rig.find_children("*", "Bone2D", true, false):
		node.transform = node.rest
	var flash := rig.find_child("MuzzleFlash", true, false)
	if flash:
		flash.visible = false

func reject(key: String, message: String) -> void:
	observations.completeness.append({"case_id": key, "error": message})

func observe_body() -> void:
	var rig := make_rig("hd", root)
	rest_all(rig)
	var tolerance: float = manifest.tolerances.pivot_px
	for joint in manifest.joints:
		var matches := rig.find_children(joint.name, "Bone2D", true, false)
		if matches.size() != 1:
			reject("bone/" + joint.name, "required Bone2D missing or duplicated")
			continue
		var bone := matches[0] as Bone2D
		var expected_parent: Node = rig.get_node("Skeleton2D") if joint.parent == null else rig.find_child(joint.parent, true, false)
		if bone.get_parent() != expected_parent:
			reject("parent/" + joint.name, "wrong skeletal parent; expected " + str(joint.parent))
		var pivot := rig.to_local(bone.global_position)
		if pivot.distance_to(Vector2(joint.pivot[0], joint.pivot[1])) > tolerance:
			reject("pivot/" + joint.name, "wrong source-pixel rest pivot: " + str(pivot))
		var limits: Array = bone.get_meta("rotation_limits_deg", [])
		if limits.size() != 2:
			reject("limits/" + joint.name, "missing joint limits")
		else:
			for endpoint in 2:
				if abs(float(limits[endpoint]) - float(joint.rotation_limits_deg[endpoint])) > float(manifest.tolerances.limit_deg):
					reject("limits/" + joint.name, "joint limits differ from test manifest")
	for slot in manifest.slots:
		var key: String = "slot/" + slot.slot
		var node_name: String = "Gun" if slot.part == "gun" else "Part_" + slot.part
		var sprite := rig.find_child(node_name, true, false) as Sprite2D
		if sprite == null or sprite.texture == null:
			reject(key, "missing required textured slot " + slot.part)
			continue
		if not sprite.texture.get_image().get_used_rect().has_area():
			reject(key + "/texture", "empty slot texture")
		if sprite.get_parent().name != slot.part_parent_bone:
			reject(key + "/parent", "wrong owning bone; expected " + slot.part_parent_bone)
		var declarations: Array = subject.parts.filter(func(p: Dictionary) -> bool: return p.id == slot.part)
		if declarations.size() != 1:
			reject(key + "/declaration", "part declaration missing or duplicated")
			continue
		var part: Dictionary = declarations[0]
		if part.parent_bone != slot.part_parent_bone or part.bone != slot.bone:
			reject(key + "/declared-parent", "declared part parent differs from manifest")
		if Vector2(part.pivot[0], part.pivot[1]).distance_to(Vector2(slot.pivot[0], slot.pivot[1])) > tolerance:
			reject(key + "/declared-pivot", "declared part pivot differs from manifest")
		if float(part.joint_overlap_px) != float(slot.overlap_px):
			reject(key + "/overlap", "declared overlap differs from manifest")
		var expected_offset := Vector2(part.offset[0], part.offset[1])
		if sprite.position.distance_to(expected_offset) > tolerance:
			reject(key + "/offset", "rendered sprite offset differs from its declaration")
	var player := rig.get_node_or_null("AnimationPlayer") as AnimationPlayer
	var head := rig.find_child("Part_" + manifest.facing.head_part, true, false) as Sprite2D
	var gun := rig.find_child("Gun", true, false) as Sprite2D
	if player == null or head == null or gun == null:
		observations.facing.append({"case_id": "facing/required-nodes", "error": "missing head/face, gun or AnimationPlayer"})
	else:
		for clip in CLIPS:
			if not player.has_animation(clip):
				observations.facing.append({"case_id": "facing/" + clip, "error": "missing animation"})
				continue
			rest_all(rig)
			player.play(clip)
			player.pause()
			for frame in range(CLIPS[clip] + 1):
				player.seek(float(frame) / FPS, true)
				var head_axis := Vector2(manifest.facing.head_intrinsic_axis[0], manifest.facing.head_intrinsic_axis[1])
				if head.flip_h:
					head_axis.x *= -1
				if head.flip_v:
					head_axis.y *= -1
				head_axis = head.global_transform.basis_xform(head_axis)
				var weapon_axis := Vector2(manifest.facing.muzzle_texture_px[0] - manifest.facing.grip_texture_px[0], manifest.facing.muzzle_texture_px[1] - manifest.facing.grip_texture_px[1])
				if gun.flip_h:
					weapon_axis.x *= -1
				if gun.flip_v:
					weapon_axis.y *= -1
				weapon_axis = gun.global_transform.basis_xform(weapon_axis)
				var passed: bool = abs(head_axis.x) > float(manifest.facing.axis_epsilon) and abs(weapon_axis.x) > float(manifest.facing.axis_epsilon) and sign(head_axis.x) == sign(weapon_axis.x)
				var item := {"case_id": "facing/%s/%d" % [clip, frame], "head_x": head_axis.x, "weapon_x": weapon_axis.x, "passed": passed}
				observations.facing_samples.append(item)
				if not passed:
					observations.facing.append({"case_id": item.case_id, "error": "head/face and weapon arm face opposite directions or have unobservable horizontal direction"})
	rig.free()
	write_json("body-observed.json", observations)

func tile(view: SubViewport, column: int, row: int) -> Control:
	var cell := Control.new()
	cell.position = Vector2(column * TILE, row * TILE)
	cell.size = Vector2(TILE, TILE)
	cell.clip_contents = true
	cell.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	view.add_child(cell)
	return cell

func local_bones(rig: Node2D) -> Dictionary:
	var transforms := {}
	for bone in rig.find_children("*", "Bone2D", true, false):
		transforms[str(bone.name)] = rig.global_transform.affine_inverse() * bone.global_transform
	return transforms

func pose_atlas() -> void:
	var poses: Array = JSON.parse_string(FileAccess.get_file_as_string(output.path_join("poses.json")))
	var view := SubViewport.new()
	view.size = Vector2i(TILE * manifest.joints.size(), TILE * 3)
	view.disable_3d = true
	view.transparent_bg = true
	view.render_target_clear_mode = SubViewport.CLEAR_MODE_ALWAYS
	root.add_child(view)
	var seams: Array = []
	for index in manifest.joints.size():
		var joint: Dictionary = manifest.joints[index]
		var parent_cell := tile(view, index, 0)
		var child_cell := tile(view, index, 1)
		var actual_cell := tile(view, index, 2)
		var background := ColorRect.new()
		background.color = Color(1, 0, 1, 1)
		background.size = Vector2(TILE, TILE)
		background.z_index = -4096
		actual_cell.add_child(background)
		var rig := make_rig("hd", actual_cell)
		rig.position = Vector2.ZERO
		rest_all(rig)
		var bone := rig.get_node_or_null(bone_path(joint.name)) as Bone2D
		if bone == null:
			seams.append({"error": "missing manifest bone or required parent", "joint": joint.name, "column": index})
			continue
		var refs: Array = []
		for sprite in rig.find_children("*", "Sprite2D", true, false):
			if sprite.get_parent() == bone or (joint.parent != null and sprite.get_parent() == bone.get_parent()):
				var native: Transform2D = rig.global_transform.affine_inverse() * sprite.global_transform
				var parent_sprite := sprite.duplicate() as Sprite2D
				var child_sprite := sprite.duplicate() as Sprite2D
				parent_cell.add_child(parent_sprite)
				child_cell.add_child(child_sprite)
				refs.append({"parent": parent_sprite, "child": child_sprite, "rest": native})
		seams.append({"rig": rig, "joint": joint.name, "parent": joint.parent, "column": index, "rest_bones": local_bones(rig), "refs": refs})
	var metadata: Array = []
	for pose in poses:
		var entries: Array = []
		for seam in seams:
			if seam.has("error"):
				entries.append({"joint": seam.joint, "column": seam.column, "error": seam.error})
				continue
			var rig: Node2D = seam.rig
			rest_all(rig)
			for bone in rig.find_children("*", "Bone2D", true, false):
				if pose.angles.has(str(bone.name)):
					bone.rotation = bone.rest.get_rotation() + deg_to_rad(float(pose.angles[str(bone.name)]))
			var posed := local_bones(rig)
			var child_delta: Transform2D = posed[seam.joint] * seam.rest_bones[seam.joint].affine_inverse()
			var parent_delta := Transform2D.IDENTITY
			if seam.parent != null:
				parent_delta = posed[seam.parent] * seam.rest_bones[seam.parent].affine_inverse()
			var current: Transform2D = posed[seam.joint]
			var crop := Transform2D(0, Vector2(TILE / 2.0, TILE / 2.0) - current.origin)
			for reference in seam.refs:
				reference.parent.transform = crop * parent_delta * reference.rest
				reference.child.transform = crop * child_delta * reference.rest
			rig.position = crop.origin
			entries.append({"joint": seam.joint, "column": seam.column, "root": seam.parent == null})
		var filename: String = "atlas-%04d.png" % metadata.size()
		await capture(view, filename)
		metadata.append({"pose": pose.id, "kind": pose.kind, "filename": filename, "joints": entries})
		if metadata.size() % 100 == 0:
			print("BODY capture ", metadata.size(), "/", poses.size())
	view.free()
	write_json("body-atlases.json", metadata)

func body_run(mode: String) -> void:
	if mode == "observe":
		observe_body()
	else:
		await pose_atlas()
	quit(0)
