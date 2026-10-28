# ВетЭксперт: промпты для изображений

Промпты на английском — так генераторы (Nano Banana, ChatGPT) точнее держат детали. Готовые файлы кладите в `img\`.

---

## 1. Hero: пёс и кот (статичная картинка)

Породы взяты с `refs\foto_hero.jpg`:
- **Пёс:** австралийская овчарка, почти белая, рыжий мраморный окрас на ушах и вокруг глаз, голубые глаза, розовый нос с коричневыми крапинками.
- **Кот:** рэгдолл сил-пойнт, длинная кремовая шерсть, тёмная маска, уши и лапы, синие глаза.

Расположение как в `refs\01.jpg`: лежат рядом, плечом к плечу, смотрят в камеру.

### Промпт
```
Photorealistic studio photograph. A mostly white Australian Shepherd with soft red-merle patches on the ears and around the eyes, bright ice-blue eyes, pink nose with liver-brown speckles, mouth slightly open in a relaxed smile, lying down on its belly with front paws extended forward. Right next to it, touching shoulders, a seal-point Ragdoll cat lying in sphinx pose: long fluffy cream coat, dark seal-brown mask, ears and paws, vivid sapphire-blue eyes. Both animals face the camera straight on, heads level, eyes wide open and looking directly into the lens, pupils centered. No collar, no tag, no harness, no clothing, no accessories — clean natural fur. Seamless solid lavender backdrop and floor (#A396EE), soft even diffused studio light, subtle contact shadow under the bodies. Full bodies visible, the dog on the left and the cat on the right, animals fill the lower 55% of the frame, empty backdrop above their heads. 85mm lens, f/8, tack-sharp eyes, ultra-detailed fur. Aspect ratio 16:9, high resolution.
```

### Негатив (если генератор поддерживает)
```
collar, tag, leash, harness, bandana, clothes, text, watermark, logo, extra limbs, extra paws, distorted eyes, heterochromia, cross-eyed, cartoon, illustration, 3D render, blurry fur
```

### Если выходит не то
- **Появился ошейник:** добавьте в начало промпта `bare neck, no collar of any kind`.
- **Животные смотрят в сторону:** `both looking straight into the camera lens, frontal symmetrical pose`.
- **Кот получился сиамским (короткая шерсть):** `long semi-long fluffy Ragdoll coat, plush ruff around the neck`.
- **Пёс стал хаски:** `Australian Shepherd, floppy folded ears, not husky`.

### Что сделать с результатом
1. Выбрать кадр, где у обоих глаза открыты и зрачки по центру. Это понадобится для будущего слежения за курсором.
2. Вырезать животных на прозрачный фон (remove.bg, Photoshop «Выделить предмет»). На сайте они должны перекрывать низ букв «ВетЭксперт», поэтому фон не нужен.
3. Сохранить как `img\hero-pets.png` (ширина не меньше 2400px). Исходник с фоном — `img\hero-pets-src.jpg`.

---

## 2. Врачи: серия (заглушки для макета)

На реальном сайте эти фото заменяются снимками настоящих врачей клиники (бриф ниже). Сгенерированные лица под видом реальных сотрудников вводят клиентов в заблуждение.

### Шаблон (меняются только [PERSON] и [PET])
```
Photorealistic portrait in a modern veterinary clinic, waist-up, centered, vertical 4:5. [PERSON] wearing lilac-violet medical scrubs (#5B4BDB) with a stethoscope around the neck, gently holding [PET] in their arms, warm genuine smile, looking at the camera. Same background in every shot: softly blurred clinic room with pale lavender walls, white shelves and framed certificates, soft window light from the left, shallow depth of field, 50mm, f/2.8. Consistent neutral color grading, no logos, no text, no name badges.
```

### Четыре варианта
| Файл | [PERSON] | [PET] |
|---|---|---|
| `img\doctor-1.jpg` | a friendly man in his early 50s with short grey hair | a fluffy seal-point Ragdoll cat |
| `img\doctor-2.jpg` | a young woman around 30 with hair in a neat ponytail | a golden retriever puppy |
| `img\doctor-3.jpg` | a man around 35 with a short dark beard | a small white kitten |
| `img\doctor-4.jpg` | a woman around 40 with curly auburn hair | a lop-eared rabbit |

Совет для единой серии: сгенерируйте первый кадр, затем остальные подавайте вместе с ним как референс с припиской `match the exact background, lighting and scrubs color of the reference image`.

---

## 3. Бриф на фотосессию реальных врачей

Чтобы настоящие фото встали на место заглушек без переделки сайта.

- **Кадр:** вертикальный 4:5, по пояс, человек по центру, над головой около 10% воздуха.
- **Фон:** один и тот же угол клиники для всех, светлая стена (лучше лавандовая или белая), полка или сертификаты в размытии. Расстояние до фона 2–3 м, диафрагма f/2.8.
- **Свет:** мягкий, из окна или софтбокс слева, без вспышки в лоб. Одинаковый для всех кадров.
- **Одежда:** одинаковая униформа (желательно лилово-фиолетовая или однотонная тёмная), стетоскоп на шее, без бейджей с крупным текстом.
- **Питомец на руках:** у каждого врача свой (кошка, щенок, котёнок, кролик), спокойный, смотрит в камеру или на врача.
- **Эмоция:** спокойная улыбка, взгляд в камеру.
- **Обработка:** одинаковая цветокоррекция на всю серию, нейтральный баланс белого.
- **Что прислать:** JPG от 2000px по длинной стороне, плюс ФИО, специализация и 1–2 предложения о каждом враче.

---

## 4. Фото для блока «О клинике»

Вертикальный кадр 4:5. Снизу на него ляжет стеклянная плашка с рейтингом, поэтому нижняя треть должна быть спокойной.

```
Photorealistic photo inside a bright modern veterinary examination room, vertical 4:5. A veterinarian in lilac-violet scrubs (#5B4BDB), seen from the chest down and slightly from the side, face out of frame, gently examining a calm fluffy seal-point Ragdoll cat sitting on a white exam table, stethoscope on the cat's chest. Pale lavender walls, soft window light from the left, shallow depth of field, calm and clean, lots of soft empty space in the lower third. No text, no logos.
```

Сохранить как `img\about.jpg` (от 1200×1500).

---

## 5. Видео: пёс и кот поворачивают головы (для слежения за курсором)

Генераторы видео прозрачный фон не отдают — это и не нужно. Видео делается на ровном лавандовом фоне, я нарезаю его на кадры, вырезаю фон и собираю последовательность для сайта: положение курсора по горизонтали выбирает кадр.

**Стартовый кадр (image-to-video):** `img\hero-video-start.png` — наши пёс и кот на ровном фоне #A396EE, 1920×1080.

**Где:** Kling, Runway, Veo, Hailuo — любой с режимом «картинка → видео». Длина 5 с, максимальное качество, 16:9.

### Промпт
```
Locked-off static camera: no camera movement, no zoom, no pan. The dog and the cat keep lying in exactly the same pose — bodies, paws and tails stay completely still. Over 5 seconds both animals slowly and smoothly turn their heads together: they start looking to the far left of the frame and finish looking to the far right, their eyes following the turn. Steady, even speed from start to end, natural subtle motion. No blinking, mouths stay the same, ears stay calm. Solid flat lavender background (#A396EE), perfectly uniform, no shadows on the background, no change in lighting, no new objects. Photorealistic, identical look to the input image.
```

### Негатив
```
camera movement, zoom, body movement, walking, standing up, background change, gradient background, shadow on background, extra animals, morphing, distorted faces, blinking, text, watermark
```

### Если не получается
- **Головы поворачиваются рывками или не до конца:** сделайте два видео от стартового кадра — «turn heads from center to the far left» и «…to the far right». Я склею их в одну последовательность.
- **Тела двигаются:** добавьте в начало `Only the heads move.`
- **Фон «плывёт» или темнеет:** повторите генерацию; я вырежу фон, но ровный фон режется чище.

Готовое видео положите в `img\` (например `hero-turn.mp4`).

---

## 6. Рентген пса и кота (проступает под курсором в героe)

На сайте под курсором будет мягкий круг, в котором животные превращаются в рентгеновский снимок. Для этого нужна вторая картинка — та же самая, но «рентген». Это **редактирование картинки**, не видео: одна-две генерации.

**Входная картинка:** `img\xray-input.png` — наши пёс и кот на ровном лавандовом фоне, 1280×720 (тот же кадр, что и исходник).

**Где:** ChatGPT (загрузить картинку и написать промпт) или Nano Banana / Gemini в режиме редактирования.

### Промпт
```
Edit this exact image. Keep the composition identical: same canvas size, same framing, both animals in exactly the same position, pose, size and silhouette outline — nothing moves, nothing is cropped, no zoom.

Turn both the dog and the cat into an X-ray radiograph. Inside each animal's silhouette the body becomes dark navy-violet X-ray film (deep #1C1A35 with soft #2E2A55 tones), and the skeleton glows in white and pale lavender, anatomically accurate for a dog and a cat: skull, eye sockets, jaw and teeth, spine, ribs, shoulder blades, pelvis, leg bones, paw phalanges and tail vertebrae. The outer fur outline stays as a faint translucent lavender glow so the silhouettes match the original exactly.

Funny hidden details, clearly visible on the X-ray: inside the dog's stomach — a swallowed tennis ball and a tiny rubber squeaky duck; inside the cat's stomach — a small jingle bell and a little fish skeleton.

The background stays a perfectly flat uniform lavender (#A396EE), untouched, with no shadows, no gradients and no text. Clean, high-detail medical X-ray style, friendly, not scary.
```

### Если вышло не то
- **Животные сдвинулись или поменяли позу:** допишите в начало `Do not move, resize or redraw the animals' outlines — only change what is inside them.` и повторите.
- **Фон тоже стал тёмным:** `Keep the background flat lavender #A396EE exactly as in the original.`
- **Слишком страшно (черепа, пустые глазницы):** `cute and friendly X-ray, soft glowing bones, no scary look.`

Готовую картинку положите в `img\` как `hero-xray.png`. Я вырежу фон, проверю и при необходимости выровняю совпадение с оригиналом по пикселям.
