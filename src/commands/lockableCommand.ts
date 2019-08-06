export class LockableCommand {

	private isLocked = false;

	protected lock() {
		if (this.isLocked) {
			return false;
		}

		this.isLocked = true;
		return true;
	}

	protected unlock() {
		this.isLocked = false;
	}
}