extends Node2D
## Interactive preview: Space fires the complete aim/fire/cooldown sequence.
## 1-4 play individual clips; Tab switches HD/pixel. Every update is 24 fps.
const FPS := 24
const FLASH_FRAMES := 3
var sequence: Array[String] = []
@onready var player: AnimationPlayer = $AnimationPlayer

func _ready() -> void:
	Engine.max_fps = FPS
	Engine.physics_ticks_per_second = FPS
	player.callback_mode_process = AnimationMixer.ANIMATION_CALLBACK_MODE_PROCESS_PHYSICS
	var is_pixel: bool = get_meta("pixel_mode")
	get_viewport().snap_2d_transforms_to_pixel = is_pixel
	# Snap origins, preserving the rigid quads' rotation and shape.
	get_viewport().snap_2d_vertices_to_pixel = false
	if get_parent() == get_tree().root:
		get_window().content_scale_size = Vector2i(128,144) if is_pixel else Vector2i(768,896)
	player.animation_finished.connect(_finished)
	player.play("idle")

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_SPACE:
			sequence.assign(["fire", "cooldown", "idle"])
			player.play("aim")
		elif event.keycode == KEY_TAB:
			get_tree().change_scene_to_file("res://scenes/hd.tscn" if get_meta("pixel_mode") else "res://scenes/pixel.tscn")
		elif event.keycode in [KEY_1, KEY_2, KEY_3, KEY_4]:
			sequence.clear()
			player.play(["idle", "aim", "fire", "cooldown"][event.keycode - KEY_1])

func _finished(_name: StringName) -> void:
	if not sequence.is_empty(): player.play(sequence.pop_front())
