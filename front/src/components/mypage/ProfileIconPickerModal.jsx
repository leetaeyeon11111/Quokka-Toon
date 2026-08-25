import Modal from '../common/Modal'
import ProfileIconPicker from './ProfileIconPicker'

export default function ProfileIconPickerModal({ selectedId, onClose, onSaved }) {
  return (
    <Modal title="기본 제공 아이콘" icon="🎨" onClose={onClose} maxWidth="max-w-2xl">
      <ProfileIconPicker
        selectedId={selectedId}
        variant="modal"
        onCancel={onClose}
        onSaved={(me) => {
          onSaved?.(me)
          onClose()
        }}
      />
    </Modal>
  )
}
