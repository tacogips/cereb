# cereb

Yet another ai chat client. Under heavily development now.

# How to install
```bash
# with nix
nix profile install "github:tacogips/cereb#cereb"
```
or
```bash
gitb clone https://github.com/tacogips/cereb
cd cereb
just build
cp ./dist/cereb your_path_dir
```

## Usage

you need to set up the following environment variables.

$ANTHROPIC_API_KEY # for claude api
$CEREB_DEFAULT_MODEL # the available model list is https://github.com/tacogips/cereb/blob/main/src/ai-service/definition.json

```bash
cat query.md
───────┬─────────────────────────────────────────────────────────────────────────────────────────────
       │ File: query.md
───────┼─────────────────────────────────────────────────────────────────────────────────────────────
   1   │
   2   │ ```cereb-meta
   3   │ this block will be ignored
   4   │ ```
   5   │
   6   │ ```python
   7   │ 2**2
   8   │ ```
   9   │
  10   │ what's the anser?
───────┴─────────────────────────────────────────────────────────────────────────────────────────────

# run
cat query.md |cereb --markdown --format markdown --with-input
# or
cereb --markdown --format markdown --with-input query.md
 ```

````markdown
user
---
```python
2**2
```
what's the anser?

assistant
---
The answer to the expression `2**2` in Python is 4.

In Python, the `**` operator represents exponentiation. So `2**2` means 2 raised to the power of 2, which is 2 * 2 = 4.

Here's a breakdown:

* 2 is the base
* 2 (the second 2) is the exponent
* 2**2 means 2 raised to the power of 2

So, 2**2 = 2 * 2 = 4

If you were to run this in a Python interpreter or script, it would indeed output 4.
```cereb-meta
input  token: 21
output token: 151
```

````



# with image
````bash
> echo "what's in this picture" | cereb --attachement https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png

{"response":[{"type":"text","text":"This image shows a portrait of a woman wearing a stylish, wide-brimmed hat. The hat appears to be made of a light-colored material, possibly straw or fabric, and is adorned with a dramatic blue feather or plume decoration on one side.\n\nThe woman has long, dark hair and is looking directly at the camera with an intense gaze. Her skin appears smooth and her features are well-defined.\n\nThe lighting in the image gives it a warm, slightly vintage feel with orange and pinkish tones. The background is somewhat out of focus but suggests an indoor setting, possibly with some architectural elements visible.\n\nThe overall style of the image, including the hat and lighting, evokes a retro or 1970s aesthetic. It has the quality of a fashion photograph or a glamour shotfrom that era."}]}
````
