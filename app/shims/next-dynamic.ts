import { defineAsyncComponent } from "vue";

export default function dynamic(loader: () => Promise<any>) {
  return defineAsyncComponent(async () => {
    const resolved = await loader();
    return resolved.default ?? resolved;
  });
}
