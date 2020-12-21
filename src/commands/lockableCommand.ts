export class LockableCommand {

	private isLocked = false;

	protected lock(): boolean {
		if (this.isLocked) {
			return false;
		}

		this.isLocked = true;
		return true;
	}

	protected unlock(): void {
		this.isLocked = false;
	}
}