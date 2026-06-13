import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/shared/ui/academis'
import { SEARCH_MIN_QUERY_LENGTH } from '@/shared/api/searchApi'
import { pickLocalized } from '@/i18n/localize'
import useGlobalSearch from '../hooks/useGlobalSearch'

const getSearchGroupLabel = (type, t) => {
  if (type === 'course') return t('common.courses')
  if (type === 'lesson') return t('common.lessons')
  return t('common.tests')
}

const SearchBox = () => {
  const { t } = useTranslation()
  const {
    searchRef,
    searchQuery,
    setSearchQuery,
    setSearchOpen,
    searchLoading,
    searchError,
    showSearchDropdown,
    groupedSearchResults,
    highlightedIndex,
    setHighlightedIndex,
    resetSearch,
    handleSelectSearchResult,
    handleSearchKeyDown,
  } = useGlobalSearch()

  return (
    <div className="gsearch" ref={searchRef}>
      <div className="input-icon">
        <Icon name="search" size={17} />
        <input
          type="search"
          className="input"
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value)
            setSearchOpen(true)
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={handleSearchKeyDown}
          aria-label={t('common.search')}
          aria-expanded={showSearchDropdown}
          aria-controls="global-search-results"
          aria-autocomplete="list"
        />
        {searchQuery && (
          <button
            type="button"
            className="gsearch__clear"
            onClick={resetSearch}
            aria-label={t('searchUi.clear')}
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>

      {showSearchDropdown && (
        <div className="search-pop" id="global-search-results" role="listbox">
          {searchQuery.trim().length > 0 && searchQuery.trim().length < SEARCH_MIN_QUERY_LENGTH && (
            <div className="search-state">{t('searchUi.minChars', { count: SEARCH_MIN_QUERY_LENGTH })}</div>
          )}

          {searchLoading && (
            <div className="search-state">{t('searchUi.loading')}</div>
          )}

          {!searchLoading && searchError && (
            <div className="search-state search-state--error">{searchError}</div>
          )}

          {!searchLoading && !searchError && searchQuery.trim().length >= SEARCH_MIN_QUERY_LENGTH && groupedSearchResults.length === 0 && (
            <div className="search-state">{t('searchUi.empty')}</div>
          )}

          {!searchLoading && !searchError && groupedSearchResults.length > 0 && groupedSearchResults.map((group) => (
            <div key={group.type}>
              <div className="search-cat">{getSearchGroupLabel(group.type, t)}</div>
              {group.items.map((item) => {
                const title = pickLocalized(item, 'title') || t(`common.${item.type}`)
                const description = pickLocalized(item, 'description')
                const courseTitle = pickLocalized(item, 'courseTitle')
                const isActiveOption = item.optionIndex === highlightedIndex

                return (
                  <button
                    key={`${item.type}-${item.courseId}-${item.lessonId || item.testId || item.courseId}`}
                    type="button"
                    className={`search-row${isActiveOption ? ' is-active' : ''}`}
                    onClick={() => handleSelectSearchResult(item)}
                    onMouseEnter={() => setHighlightedIndex(item.optionIndex)}
                    onMouseDown={(event) => event.preventDefault()}
                    role="option"
                    aria-selected={isActiveOption}
                  >
                    <div className="search-row__body">
                      <div className="search-row__title">{title}</div>
                      {courseTitle && item.type !== 'course' && (
                        <div className="search-row__meta">
                          {t('searchUi.inCourse', { title: courseTitle })}
                        </div>
                      )}
                      {description && (
                        <span className="search-row__desc">{description}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBox
