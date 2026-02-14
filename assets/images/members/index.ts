/**
 * Member Photo Card Images
 *
 * Uses require.context to auto-detect all .jpg files in each member folder
 * at build time. No manual listing needed — just drop an image and rebuild.
 *
 * Naming convention: {era}-{number}.jpg (e.g., srm-1.jpg, run-2.jpg)
 * Image key format: {member}-{era}-{number} (e.g., yunah-srm-1)
 */

function buildImageMap(memberId: string, ctx: ReturnType<typeof require.context>): Record<string, any> {
  const images: Record<string, any> = {};
  for (const key of ctx.keys()) {
    // key is like './srm-1.jpg'
    const filename = key.replace('./', '').replace('.jpg', '');
    images[`${memberId}-${filename}`] = ctx(key);
  }
  return images;
}

export const yunah = buildImageMap('yunah', require.context('./yunah', false, /\.jpg$/));
export const minju = buildImageMap('minju', require.context('./minju', false, /\.jpg$/));
export const moka = buildImageMap('moka', require.context('./moka', false, /\.jpg$/));
export const wonhee = buildImageMap('wonhee', require.context('./wonhee', false, /\.jpg$/));
export const iroha = buildImageMap('iroha', require.context('./iroha', false, /\.jpg$/));

export type MemberId = 'yunah' | 'minju' | 'moka' | 'wonhee' | 'iroha';
export type PhotoCardId = string;

export const getMemberPhoto = (memberId: MemberId, photoCardId: PhotoCardId) => {
  const memberImages: Record<MemberId, Record<string, any>> = {
    yunah,
    minju,
    moka,
    wonhee,
    iroha,
  };

  return memberImages[memberId]?.[photoCardId] || null;
};
