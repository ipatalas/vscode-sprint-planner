export default function debounce(callback: Function, delay: number) {
	let timeout: NodeJS.Timeout;

	return (...args: any) => {
		const next = () => callback(...args);
		clearTimeout(timeout);
		timeout = setTimeout(next, delay);
	};
}
