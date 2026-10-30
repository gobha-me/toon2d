extends SceneTree
## Independent observer: only public scene, animation and texture APIs.

const FPS := 24.0
const TIME_EPS := 0.000001
const GEOM_EPS := 0.001
const CLIPS := {"idle": 48, "aim": 10, "fire": 6, "cooldown": 14}
var spec: Dictionary
var output: String
var rendering := false
var results := {"cases": {}, "samples": {}, "captures": []}

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	rendering = args[0] == "render"
	output = args[1]
	spec = JSON.parse_string(FileAccess.get_file_as_string("res://parts.json"))
	call_deferred("run")

func problem(case_id: String, message: String) -> void:
	if not results.cases.has(case_id):
		results.cases[case_id] = []
	results.cases[case_id].append(message)

func bone_path(name_: String) -> NodePath:
	for bone in spec.bones:
		if bone.name == name_:
			if bone.parent == null:
				return NodePath("Skeleton2D/" + name_)
			return NodePath(str(bone_path(bone.parent)) + "/" + name_)
	return NodePath("__missing_bone__")

func make_rig(mode: String, view: Node) -> Node2D:
	var packed: PackedScene = load("res://scenes/" + mode + ".tscn")
	var rig: Node2D = packed.instantiate()
	rig.process_mode = Node.PROCESS_MODE_DISABLED
	view.add_child(rig)
	var player: AnimationPlayer = rig.get_node_or_null("AnimationPlayer")
	if player:
		player.stop()
	var camera: Camera2D = rig.get_node_or_null("Camera2D")
	if camera:
		camera.enabled = false
	return rig

func restore_rest(rig: Node2D) -> void:
	var player: AnimationPlayer = rig.get_node_or_null("AnimationPlayer")
	if player:
		player.stop()
	for b in spec.bones:
		var node := rig.get_node_or_null(bone_path(b.name))
		if node is Bone2D:
			node.transform = node.rest
	var flash := rig.find_child("MuzzleFlash", true, false)
	if flash:
		flash.visible = false

func bbox_in_hand(gun: Sprite2D, hand: Node2D) -> Array:
	if gun.texture == null or hand == null:
		return []
	var image_: Image = gun.texture.get_image()
	var used := image_.get_used_rect()
	if not used.has_area():
		return []
	var rect := gun.get_rect()
	var texture_size := Vector2(gun.texture.get_size())
	var ratio := rect.size / texture_size
	var relative: Transform2D = hand.global_transform.affine_inverse() * gun.global_transform
	var points: Array[Vector2] = []
	for x in [used.position.x, used.end.x]:
		for y in [used.position.y, used.end.y]:
			var uv := Vector2(x, y)
			if gun.flip_h:
				uv.x = texture_size.x - uv.x
			if gun.flip_v:
				uv.y = texture_size.y - uv.y
			points.append(relative * (rect.position + uv * ratio))
	var box := Rect2(points[0], Vector2.ZERO)
	for p in points:
		box = box.expand(p)
	return [box.position.x, box.position.y, box.end.x, box.end.y]

func observe(mode: String) -> void:
	var rig := make_rig(mode, root)
	for id in ["1", "2", "3", "4"]:
		results.cases[mode + "/" + id] = []
	for b in spec.bones:
		var node := rig.get_node_or_null(bone_path(b.name))
		if not node is Bone2D:
			problem(mode + "/1", "missing Bone2D " + str(bone_path(b.name)))
		else:
			var expected_parent: Node = rig.get_node("Skeleton2D") if b.parent == null else rig.get_node_or_null(bone_path(b.parent))
			if node.get_parent() != expected_parent:
				problem(mode + "/1", "wrong parent for " + b.name)
	for part in spec.parts:
		var node_name: String = "Gun" if part.id == "gun" else "Part_" + part.id
		var path := NodePath(str(bone_path(part.parent_bone)) + "/" + node_name)
		var node := rig.get_node_or_null(path)
		if not node is Sprite2D or node.texture == null:
			problem(mode + "/1", "missing textured Sprite2D " + str(path))
	var player: AnimationPlayer = rig.get_node_or_null("AnimationPlayer")
	var gun: Sprite2D = rig.find_child("Gun", true, false)
	var hand := rig.get_node_or_null(bone_path("right_hand")) as Node2D
	var flash: Node2D = rig.find_child("MuzzleFlash", true, false)
	if player == null:
		for id in ["2", "3", "4"]:
			problem(mode + "/" + id, "missing AnimationPlayer")
		rig.free()
		return
	if gun == null:
		problem(mode + "/4", "missing Gun")
	if hand == null:
		problem(mode + "/4", "missing right_hand")
	if flash == null:
		problem(mode + "/3", "missing MuzzleFlash")
	var baseline: Array = bbox_in_hand(gun, hand) if gun else []
	for clip in CLIPS:
		if not player.has_animation(clip):
			problem(mode + "/2", "missing animation " + clip)
	for clip in player.get_animation_list():
		var anim := player.get_animation(clip)
		if CLIPS.has(clip) and abs(anim.length - CLIPS[clip] / FPS) > TIME_EPS:
			problem(mode + "/2", "%s length %.9f" % [clip, anim.length])
		if clip == "idle" and anim.loop_mode != Animation.LOOP_LINEAR:
			problem(mode + "/2", "idle must loop linearly")
		for track in anim.get_track_count():
			var path := anim.track_get_path(track)
			var target := rig.get_node_or_null(NodePath(str(path).split(":")[0]))
			# Resolve relative to AnimationPlayer.root_node, not a textual Gun substring.
			var animation_root := player.get_node_or_null(player.root_node)
			if animation_root:
				target = animation_root.get_node_or_null(NodePath(str(path).split(":")[0]))
			if gun and target and (target == gun or gun.is_ancestor_of(target)):
				problem(mode + "/4", "%s track %d targets %s" % [clip, track, path])
			for key in anim.track_get_key_count(track):
				var t := anim.track_get_key_time(track, key)
				if abs(t - round(t * FPS) / FPS) > TIME_EPS:
					problem(mode + "/2", "%s track %d key %d off-grid %.9f" % [clip, track, key, t])
		var lit: Array = []
		var sample_count := int(ceil(anim.length * FPS - TIME_EPS))
		restore_rest(rig)
		player.play(clip)
		player.pause()
		for frame in range(sample_count + 1):
			var time_ := minf(frame / FPS, anim.length)
			player.seek(time_, true)
			if flash and flash.is_visible_in_tree():
				if frame < sample_count:
					lit.append(frame)
				if clip != "fire" or frame == sample_count:
					problem(mode + "/3", "%s frame %d unexpectedly visible" % [clip, frame])
			if gun:
				if (gun.scale - Vector2.ONE).length() > TIME_EPS or abs(gun.skew) > TIME_EPS:
					problem(mode + "/4", "%s frame %d scale/skew" % [clip, frame])
				var box := bbox_in_hand(gun, hand)
				if box.size() != 4 or baseline.size() != 4:
					problem(mode + "/4", "empty gun texture bounding box")
				else:
					for edge in 4:
						if abs(box[edge] - baseline[edge]) > GEOM_EPS:
							problem(mode + "/4", "%s frame %d gun bbox changed" % [clip, frame])
		if lit.size() > 3:
			problem(mode + "/3", "%s flash visible on %d frames: %s" % [clip, lit.size(), lit])
		results.samples[mode + "/" + clip] = {"frames": sample_count, "flash_frames": lit, "endpoint_checked": true}
	rig.free()

func capture(view: SubViewport, path: String) -> void:
	view.render_target_update_mode = SubViewport.UPDATE_ONCE
	await process_frame
	await RenderingServer.frame_post_draw
	var image_: Image = view.get_texture().get_image()
	var error := image_.save_png(output.path_join(path))
	if error != OK:
		push_error("capture failed " + path)
		quit(2)

func joint_captures(mode: String) -> void:
	var radius := 32 if mode == "hd" else 3
	var size_ := radius * 2 + 8
	var centre := Vector2(size_ / 2.0, size_ / 2.0)
	var view := SubViewport.new()
	view.size = Vector2i(size_, size_)
	view.disable_3d = true
	view.transparent_bg = true
	view.render_target_clear_mode = SubViewport.CLEAR_MODE_ALWAYS
	root.add_child(view)
	var background := Polygon2D.new()
	background.polygon = PackedVector2Array([Vector2(-100000, -100000), Vector2(100000, -100000), Vector2(100000, 100000), Vector2(-100000, 100000)])
	background.color = Color(1, 0, 1, 1)
	background.z_index = -4096
	view.add_child(background)
	var rig := make_rig(mode, view)
	var sprites := rig.find_children("*", "Sprite2D", true, false)
	for b in spec.bones:
		for limit in 2:
			restore_rest(rig)
			var bone := rig.get_node_or_null(bone_path(b.name)) as Bone2D
			var item := {"mode": mode, "joint": b.name, "limit": "min" if limit == 0 else "max", "angle": b.rotation_limits_deg[limit], "radius": radius, "root": b.parent == null}
			if bone == null:
				item["error"] = "missing bone"
				results.captures.append(item)
				continue
			var pivot := bone.global_position
			var angle: float = deg_to_rad(b.rotation_limits_deg[limit])
			var base := Transform2D(0, centre - pivot)
			var rotate_about := Transform2D(angle, Vector2.ZERO)
			rotate_about.origin = pivot - rotate_about * pivot
			var prefix: String = mode + "-" + b.name + "-" + item.limit
			# U: real parent/child art, at authored rest, transformed as a whole.
			for sprite in sprites:
				sprite.visible = sprite.get_parent() == bone or (b.parent != null and sprite.get_parent() == bone.get_parent())
			background.visible = false
			view.canvas_transform = base
			await capture(view, prefix + "-parent.png")
			view.canvas_transform = base * rotate_about
			await capture(view, prefix + "-child.png")
			# Actual complete rig: just this one bone is rotated; all others at rest.
			for sprite in sprites:
				sprite.visible = true
			background.visible = true
			view.canvas_transform = base
			bone.rotation = bone.rest.get_rotation() + angle
			await capture(view, prefix + "-actual.png")
			item["prefix"] = prefix
			results.captures.append(item)
	view.free()

func run() -> void:
	for mode in ["hd", "pixel"]:
		if rendering:
			await joint_captures(mode)
		else:
			observe(mode)
	var file := FileAccess.open(output.path_join("captures.json" if rendering else "observed.json"), FileAccess.WRITE)
	file.store_string(JSON.stringify(results, "\t"))
	file.close()
	quit(0)
