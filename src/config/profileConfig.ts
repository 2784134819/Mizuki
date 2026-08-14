import type { ProfileConfig } from "../types/config";

// 个人资料配置
export const profileConfig: ProfileConfig = {
	avatar: "https://image-blog-1334327128.cos.ap-guangzhou.myqcloud.com/image/2C4B4A4D4846CBDD192316C82E1B7009.jpg", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	name: "Stella",
	bio: "个人博客",
	typewriter: {
		enable: true, // 启用个人简介打字机效果
		speed: 80, // 打字速度（毫秒）
	},
	links: [
		// {
		// 	name: "Bilibili",
		// 	icon: "fa7-brands:bilibili",
		// 	url: "https://space.bilibili.com/701864046",
		// },
		{
			name: "Gitee",
			icon: "mdi:git",
			url: "https://gitee.com/chenxi-huang",
		},
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/2784134819?tab=repositories",
		},
		// {
		// 	name: "Codeberg",
		// 	icon: "simple-icons:codeberg",
		// 	url: "https://codeberg.org",
		// },
		// {
		// 	name: "Discord",
		// 	icon: "fa7-brands:discord",
		// 	url: "https://discord.gg/MqW6TcQtVM",
		// },
	],
};
