import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/** Next 16 부터 `next lint` 가 제거되어 eslint 를 직접 돌린다 (flat config). */
const config = [
  { ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
];

export default config;
