"""Caption for each gambit-reel frame, mirroring SCRIPT in prototype/face.js."""
SCRIPT = [
    (1.6, 'neutral'), (2.0, 'happy'), (2.0, 'angry'), (2.0, 'sad'), (2.2, 'surprised (squint take)'),
    (2.2, 'distressed'), (2.8, 'distracted: glance left'), (2.8, 'distracted: glance right'),
    (5.0, 'breathing harder -> winded'), (3.0, 'distressed + winded'), (3.4, 'happy + distracted'),
    (3.0, 'talking (happy)'), (3.0, 'angry yelling'), (3.2, 'projecting over noise'), (3.2, 'interjecting'),
    (1.6, 'pain: light hit'), (1.8, 'pain: heavy hit'), (4.0, 'hurting + breathing hard'), (2.0, 'recovering'), (1.8, 'neutral'),
]


def labels(n, dt):
    res = []
    for i in range(n):
        t, acc = (i + 1) * dt, 0
        lab = SCRIPT[-1][1]
        for d, name in SCRIPT:
            acc += d
            if t <= acc:
                lab = name
                break
        res.append(lab)
    return res
