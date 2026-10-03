export const MEDIA_SERVICES = [
  "Technology & Digital Solutions",
  "Digital Marketing & Lead Generation",
  "Branding & Creative Design",
  "Video & AI Content"
];

export function serviceFor(record) {
  return record?.service || record?.plan || record?.industry || "";
}
