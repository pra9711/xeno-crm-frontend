// SettingsModal: small modal wrapper for account/settings related dialogs.
// Intentionally kept minimal here — content is provided via props in real usage.

export default function SettingsModal({ open = false, onClose = () => {} }: { open?: boolean; onClose?: () => void }) {
	if (!open) return null
	return (
		<div role="dialog" aria-modal className="fixed inset-0 flex items-center justify-center">
			<div className="bg-white rounded-lg p-6 shadow-lg">Settings modal content (stub)</div>
		</div>
	)
}

