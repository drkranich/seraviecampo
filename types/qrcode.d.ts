declare module "qrcode" {
  export function toString(
    text: string,
    options?: Record<string, unknown>
  ): Promise<string>;
  export function toDataURL(
    text: string,
    options?: Record<string, unknown>
  ): Promise<string>;
  const _default: { toString: typeof toString; toDataURL: typeof toDataURL };
  export default _default;
}
