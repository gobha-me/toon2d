extends Node2D
## Procedural graphic, independent of the gun and never part of its texture.
func _draw() -> void:
	var pixel: bool = get_meta("pixel_mode", false)
	if pixel:
		draw_rect(Rect2(-2, 0, 4, 7), Color("ffc75e"))
		draw_rect(Rect2(-1, 1, 2, 4), Color("fff1bb"))
	else:
		draw_colored_polygon(PackedVector2Array([Vector2(-18, 0), Vector2(-39, 38), Vector2(-15, 29), Vector2(0, 100), Vector2(13, 33), Vector2(38, 46), Vector2(18, 0)]), Color("ffb241"))
		draw_colored_polygon(PackedVector2Array([Vector2(-10, 0), Vector2(0, 64), Vector2(11, 0)]), Color("fff1bc"))
