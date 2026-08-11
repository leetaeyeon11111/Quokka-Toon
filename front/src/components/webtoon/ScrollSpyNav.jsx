export default function ScrollSpyNav({ sections, activeId }) {
  function handleClick(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="group sticky top-24 hidden shrink-0 self-start rounded-2xl border border-ink-100 bg-white py-3 transition-all duration-200 md:block md:w-10 md:hover:w-36">
      <ul className="flex flex-col gap-1 px-2">
        {sections.map((section) => {
          const active = section.id === activeId
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => handleClick(section.id)}
                className="flex w-full items-center gap-2 rounded-lg px-1.5 py-2 text-left"
              >
                <span
                  className={`h-1.5 w-4 shrink-0 rounded-full transition-colors ${
                    active ? 'bg-brand-500' : 'bg-ink-100 group-hover:bg-ink-200'
                  }`}
                />
                <span
                  className={`hidden truncate text-xs font-semibold transition-colors group-hover:inline ${
                    active ? 'text-brand-500' : 'text-ink-500'
                  }`}
                >
                  {section.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
