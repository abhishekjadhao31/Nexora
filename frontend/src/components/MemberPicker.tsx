import { useState } from 'react';
import type { ProjectMember, UserSearchResult } from '../api/types';
import { searchUsers } from '../services/users';

type SelectedMember = Pick<ProjectMember, 'id' | 'name' | 'email' | 'role' | 'projectRole'>;

type Props = {
  selected: SelectedMember[];
  onChange: (members: SelectedMember[]) => void;
  currentUserId: string;
};

export function MemberPicker({ selected, onChange, currentUserId }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (query.trim().length < 2) {
      setError('Enter at least two characters to search members.');
      setResults([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setResults(await searchUsers(query.trim()));
    } catch (requestError) {
      setResults([]);
      setError(requestError instanceof Error ? requestError.message : 'Unable to search members.');
    } finally {
      setLoading(false);
    }
  };

  const addMember = (user: UserSearchResult) => {
    if (selected.some((member) => member.id === user.id)) return;
    onChange([...selected, { ...user, projectRole: 'MEMBER' }]);
  };

  const removeMember = (userId: string) => {
    onChange(selected.filter((member) => member.id !== userId));
  };

  return (
    <div className="member-picker">
      <label htmlFor="member-search">Add project members</label>
      <div className="toolbar">
        <input id="member-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or UUID" />
        <button type="button" className="secondary-button compact" onClick={() => void search()} disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {!loading && query.trim().length >= 2 && !error && results.length === 0 && <p className="empty-state">No registered members match that search.</p>}
      {results.length > 0 && (
        <div className="member-search-results" aria-label="Member search results">
          {results.filter((result) => result.id !== currentUserId).map((result) => {
            const alreadySelected = selected.some((member) => member.id === result.id);
            return (
              <div key={result.id} className="project-row">
                <span>
                  <strong>{result.name}</strong>
                  <small>{result.email} / {result.role}</small>
                </span>
                <div className="detail-actions">
                  <button type="button" className="secondary-button compact" onClick={() => addMember(result)} disabled={alreadySelected}>{alreadySelected ? 'Selected' : 'Add'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="selected-members" aria-label="Selected project members">
        {selected.map((member) => (
          <div key={member.id} className="project-row">
            <span>
              <strong>{member.name}</strong>
              <small>{member.email}</small>
            </span>
            <select aria-label={`Project role for ${member.name}`} value={member.projectRole} onChange={(event) => onChange(selected.map((item) => item.id === member.id ? { ...item, projectRole: event.target.value as 'LEADER' | 'MEMBER' } : item))}>
              <option value="MEMBER">Member</option>
              <option value="LEADER">Leader</option>
            </select>
            <button type="button" className="secondary-button compact" onClick={() => removeMember(member.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
