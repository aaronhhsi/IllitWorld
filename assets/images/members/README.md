# Member Photo Cards

This directory contains all member photo card images for the IllitWorld game.

## Directory Structure

```
members/
├── yunah/
├── minju/
├── moka/
├── wonhee/
├── iroha/
└── index.ts (centralized imports)
```

## Image Specifications

### Resolution & Dimensions
- **Recommended dimensions:** 800x1200px (2:3 aspect ratio)
- **Alternative options:** 600x900px (smaller) or 1000x1500px (higher quality)
- **Aspect ratio:** Keep consistent 2:3 ratio to match the card design

### File Format
- **Preferred:** JPG (better compression for photos)
- **Alternative:** PNG (if transparency needed, though not required for photo cards)
- **Quality:** 80-90% for JPG compression

### File Size
- **Target:** 200-300KB per image
- **Maximum:** 500KB per image
- Use tools like [TinyJPG](https://tinyjpg.com/) or [ImageOptim](https://imageoptim.com/) to optimize

## Naming Convention

Image files should be named with the era abbreviation (without member name prefix):

- `run-0.jpg` - R U Next? era
- `srm-0.jpg` - Super Real Me era
- `ily-0.jpg` - I'll Like You era
- `tyt-0.jpg` - Toki Yo Tomare era
- `bomb-0.jpg` - Bomb era
- `nca-0.jpg` - Not Cute Anymore era
- `misc-0.jpg` - Miscellaneous/Solo content

**Note:** The import keys in `index.ts` include the member prefix (e.g., `'yunah-run-0'`) to match the photo card IDs in `data/photoCards.ts`, but the actual image files don't need the prefix.

## Adding New Images

1. **Prepare your image:**
   - Crop to 2:3 aspect ratio
   - Resize to 800x1200px
   - Optimize file size to ~200-300KB
   - Save as JPG with 80-90% quality

2. **Add to the appropriate member folder:**
   ```
   assets/images/members/yunah/run-0.jpg
   ```

3. **Update index.ts if adding new eras/cards:**
   - Add new import in the member's object
   - Images will automatically be available through `getMemberPhoto()`

## Resolution Handling

React Native automatically handles different screen densities. When using `require()`:
- Images are automatically scaled appropriately for device DPI
- No need for @2x or @3x versions (Expo handles this)
- `resizeMode="cover"` ensures images fill the card without distortion

## Usage Example

```typescript
import { getMemberPhoto } from '@/assets/images/members';

// In your component:
const photoSource = getMemberPhoto('yunah', 'run-0');

<Image
  source={photoSource}
  style={styles.cardImage}
  resizeMode="cover"
/>
```

## Fallback Strategy

The app will:
1. Try to load local image via `getMemberPhoto()`
2. Fall back to `imageUrl` from photo card data (if provided)
3. Show placeholder with member's initial if no image available

## Adding Multiple Variants (Future)

If you want to add multiple photos per era:
- Use naming like: `run-0.jpg`, `run-1.jpg`, `run-2.jpg`
- Update the photoCards.ts data structure to include multiple cards
- Update the index.ts exports accordingly
