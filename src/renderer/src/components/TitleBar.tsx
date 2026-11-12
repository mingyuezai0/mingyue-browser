import { BrandLockup } from './Brand'
import { WindowControls } from './WindowControls'

export function TitleBar({
  pageTitle,
  isPrivate,
  showBrand
}: {
  pageTitle: string
  isPrivate: boolean
  showBrand: boolean
}): React.ReactElement {
  return (
    <header
      className="titlebar"
      onDoubleClick={(event) => {
        if (
          (event.target as HTMLElement).closest(
            '.window-controls, .titlebar-brand'
          )
        ) {
          return
        }
        void window.mingyue?.window.toggleMaximize()
      }}
    >
      {showBrand && (
        <div className="titlebar-brand">
          <BrandLockup />
        </div>
      )}
      <div className="titlebar-drag">
        <span className="titlebar-page-title">{pageTitle}</span>
        {isPrivate && <span className="private-badge">无痕</span>}
      </div>
      <WindowControls />
    </header>
  )
}
