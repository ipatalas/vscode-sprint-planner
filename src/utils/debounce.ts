/* eslint-disable @typescript-eslint/no-explicit-any */
export default function debounce<Params extends any[]>(callback: (...args: Params) => any, delay: number): (...args: any) => void {
	let timeout: NodeJS.Timeout;

	return (...args: any) => {
		const next = () => callback(...args);
		clearTimeout(timeout);
		timeout = setTimeout(next, delay);
	};
}
