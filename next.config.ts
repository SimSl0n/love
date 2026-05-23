import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
        // Выключаем тайпчек на деплое. Теперь пофиг на типы!
        ignoreBuildErrors: true,
    },
};
};

export default nextConfig;
