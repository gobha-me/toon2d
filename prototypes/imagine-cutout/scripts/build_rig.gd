extends SceneTree
## Authoring utility: bake native Skeleton2D/Bone2D and AnimationPlayer scenes.
const FPS := 24
const FLASH_FRAMES := 3
const VERSION := "4.7.2.stable.official.ed1daf0bf"
var data: Dictionary
var bone_paths: Dictionary
var rig: Node2D
var pixel: bool

func _initialize() -> void:
	data = JSON.parse_string(FileAccess.get_file_as_string("res://parts.json"))
	var manifest: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://body_parts.yml"))
	# Contract order is inventory order, not skeletal order: knees follow boots.
	data.bones = []
	var pending: Array = manifest.joints.duplicate(true)
	var emitted := {}
	while not pending.is_empty():
		var advanced := false
		for spec in pending.duplicate():
			if spec.parent == null or emitted.has(spec.parent):
				data.bones.append(spec)
				emitted[spec.name] = true
				pending.erase(spec)
				advanced = true
		if not advanced:
			push_error("Missing or cyclic manifest parent")
			quit(1)
			return
	for mode in [false, true]:
		pixel = mode
		build()
	quit()

func owned(node: Node, parent: Node) -> void:
	parent.add_child(node)
	node.owner = rig

func vec(values: Array) -> Vector2:
	var v := Vector2(values[0], values[1])
	return (v * float(data.pixel_scale)).round() if pixel else v

func build() -> void:
	rig = Node2D.new()
	rig.name = "ImaginePixel" if pixel else "ImagineHD"
	rig.set_script(load("res://scripts/rig_control.gd"))
	rig.set_meta("pixel_mode", pixel)
	rig.set_meta("godot_version", VERSION)
	rig.set_meta("fps", FPS)
	rig.set_meta("flash_frames", FLASH_FRAMES)
	rig.set_meta("overlap_px", data.overlap_px)
	rig.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST if pixel else CanvasItem.TEXTURE_FILTER_LINEAR
	rig.position = Vector2(26, 5) if pixel else Vector2(350, 20)
	var skeleton := Skeleton2D.new()
	skeleton.name = "Skeleton2D"
	owned(skeleton, rig)
	var bones := {}
	var pivots := {}
	bone_paths = {}
	for spec in data.bones:
		var bone := Bone2D.new()
		bone.name = spec.name
		var pivot := vec(spec.pivot)
		var parent: Node = skeleton if spec.parent == null else bones[spec.parent]
		bone.position = pivot if spec.parent == null else pivot - pivots[spec.parent]
		bone.rest = Transform2D(0.0, bone.position)
		bone.set_autocalculate_length_and_angle(false)
		bone.length = 8 if pixel else 80
		bone.set_meta("rotation_limits_deg", spec.rotation_limits_deg)
		owned(bone, parent)
		bones[spec.name] = bone
		pivots[spec.name] = pivot
		bone_paths[spec.name] = str(rig.get_path_to(bone))
	for part in data.parts:
		var sprite := Sprite2D.new()
		sprite.name = "Gun" if part.id == "gun" else "Part_" + part.id
		sprite.texture = load("res://" + (part.texture_pixel if pixel else part.texture_hd))
		sprite.centered = false
		if pixel and part.has("pixel_region"):
			var region: Array = part.pixel_region
			sprite.region_enabled = true
			sprite.region_rect = Rect2(region[0], region[1], region[2], region[3])
		sprite.position = Vector2(part.pixel_offset[0], part.pixel_offset[1]) if pixel else Vector2(part.offset[0], part.offset[1])
		sprite.rotation_degrees = float(part.get("sprite_rotation_deg", 0.0))
		var sprite_scale: Array = part.get("sprite_scale", [1, 1])
		sprite.scale = Vector2(sprite_scale[0], sprite_scale[1])
		sprite.z_index = part.z_order
		sprite.z_as_relative = false
		sprite.set_meta("source", part.source)
		sprite.set_meta("classification", part.classification)
		owned(sprite, bones[part.bone])
	if pixel:
		for backing in data.get("pixel_backings", []):
			var cap := Polygon2D.new()
			cap.name = "Backing_" + backing.bone
			var points := PackedVector2Array()
			for index in 24:
				points.append((Vector2.from_angle(TAU * index / 24.0) * backing.radius).round())
			cap.polygon = points
			cap.color = Color(backing.color[0] / 255.0, backing.color[1] / 255.0, backing.color[2] / 255.0)
			cap.z_index = backing.z_order
			cap.z_as_relative = false
			owned(cap, bones[backing.bone])
	# One gun sprite, no animation tracks target its transform or texture.
	var flash := Node2D.new()
	flash.name = "MuzzleFlash"
	flash.set_script(load("res://scripts/muzzle_flash.gd"))
	flash.set_meta("pixel_mode", pixel)
	flash.position = vec(data.gun_muzzle_rig) - pivots.right_hand
	if data.has("facing_setup"):
		flash.position = flash.position.rotated(deg_to_rad(data.facing_setup.grip_rotation_deg))
		flash.rotation = deg_to_rad(-18 + data.facing_setup.grip_rotation_deg)
	else:
		flash.rotation = deg_to_rad(-18)
	flash.visible = false
	flash.z_index = 30
	flash.z_as_relative = false
	owned(flash, bones.right_hand)
	var player := AnimationPlayer.new()
	player.name = "AnimationPlayer"
	owned(player, rig)
	var library := AnimationLibrary.new()
	for clip in ["idle", "aim", "fire", "cooldown"]:
		library.add_animation(clip, make_animation(clip, str(rig.get_path_to(flash))))
	player.add_animation_library("", library)
	var camera := Camera2D.new()
	camera.name = "Camera2D"
	camera.position = Vector2(38, 67) if pixel else Vector2(450, 880)
	camera.zoom = Vector2.ONE if pixel else Vector2(.45, .45)
	camera.position_smoothing_enabled = false
	owned(camera, rig)
	var packed := PackedScene.new()
	packed.pack(rig)
	var path := "res://scenes/" + ("pixel" if pixel else "hd") + ".tscn"
	var error := ResourceSaver.save(packed, path)
	print("Baked ", path, " result=", error)
	rig.free()

func track(anim: Animation, path: String, property: String, keys: Array, discrete: bool = false) -> void:
	var index := anim.add_track(Animation.TYPE_VALUE)
	anim.track_set_path(index, NodePath(path + ":" + property))
	anim.value_track_set_update_mode(index, Animation.UPDATE_DISCRETE if discrete else Animation.UPDATE_CONTINUOUS)
	for key in keys:
		anim.track_insert_key(index, float(key[0]) / FPS, key[1])

func rotations(anim: Animation, bone: String, keys: Array) -> void:
	var radians: Array = []
	for key in keys: radians.append([key[0], deg_to_rad(key[1])])
	track(anim, bone_paths[bone], "rotation", radians)

func make_animation(clip: String, flash_path: String) -> Animation:
	var anim := Animation.new()
	anim.resource_name = clip
	anim.step = 1.0 / FPS
	var frames: int = {"idle": 48, "aim": 10, "fire": 6, "cooldown": 14}[clip]
	anim.length = float(frames) / FPS
	anim.loop_mode = Animation.LOOP_LINEAR if clip == "idle" else Animation.LOOP_NONE
	# Every clip explicitly authors every joint, including static joints.
	for spec in data.bones: rotations(anim, spec.name, [[0, 0.0], [frames, 0.0]])
	var base := vec(data.bones[0].pivot)
	var breathe := 1 if pixel else 3
	if clip == "idle":
		track(anim, bone_paths.hip, "position", [[0,base],[12,base+Vector2(0,-breathe)],[24,base],[36,base+Vector2(0,breathe)],[48,base]])
		set_rotation(anim,"torso",[[0,-.35],[12,.35],[24,-.35],[36,.35],[48,-.35]])
		set_rotation(anim,"hem_left",[[0,-1.2],[12,1.2],[24,-1.2],[36,1.2],[48,-1.2]])
		set_rotation(anim,"hem_right",[[0,1],[12,-1],[24,1],[36,-1],[48,1]])
		set_rotation(anim,"hem_center",[[0,0],[12,.8],[24,0],[36,-.8],[48,0]])
	elif clip == "aim":
		track(anim,bone_paths.hip,"position",[[0,base],[frames,base]])
		set_rotation(anim,"right_upper",[[0,0],[3,18],[7,63],[10,75]])
		set_rotation(anim,"right_fore",[[0,0],[4,2],[10,8]])
		set_rotation(anim,"torso",[[0,0],[10,-2]])
		set_rotation(anim,"head",[[0,0],[10,2]])
		set_rotation(anim,"hem_left",[[0,0],[4,-4],[10,2]])
		set_rotation(anim,"hem_right",[[0,0],[6,4],[10,-2]])
		set_rotation(anim,"hem_center",[[0,0],[6,-2],[10,1]])
	elif clip == "fire":
		track(anim,bone_paths.hip,"position",[[0,base],[frames,base]])
		set_rotation(anim,"right_upper",[[0,75],[2,80],[6,75]])
		set_rotation(anim,"right_fore",[[0,8],[2,8],[6,8]])
		set_rotation(anim,"torso",[[0,-2],[2,0],[6,-2]])
		set_rotation(anim,"head",[[0,2],[6,2]])
		set_rotation(anim,"hem_left",[[0,2],[3,-4],[6,1]])
		set_rotation(anim,"hem_right",[[0,-2],[3,4],[6,-1]])
		set_rotation(anim,"hem_center",[[0,1],[3,-2],[6,.5]])
	else:
		track(anim,bone_paths.hip,"position",[[0,base],[frames,base]])
		set_rotation(anim,"right_upper",[[0,75],[4,60],[10,12],[14,0]])
		set_rotation(anim,"right_fore",[[0,8],[14,0]])
		set_rotation(anim,"torso",[[0,-2],[14,0]])
		set_rotation(anim,"head",[[0,2],[14,0]])
		set_rotation(anim,"hem_left",[[0,1],[5,3],[10,-1],[14,0]])
		set_rotation(anim,"hem_right",[[0,-1],[5,-3],[10,1],[14,0]])
		set_rotation(anim,"hem_center",[[0,.5],[5,-1.5],[10,.5],[14,0]])
	track(anim,flash_path,"visible",[[0,clip=="fire"],[FLASH_FRAMES,false],[frames,false]] if clip=="fire" else [[0,false],[frames,false]],true)
	return anim

func set_rotation(anim: Animation, bone: String, keys: Array) -> void:
	var path := NodePath(str(bone_paths[bone])+":rotation")
	var index := anim.find_track(path,Animation.TYPE_VALUE)
	anim.remove_track(index)
	rotations(anim,bone,keys)
