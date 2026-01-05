// src/components/FriendSearch.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase.js'; // 
import { supabaseService } from '../services/supabaseService.js'; // 

export default function FriendSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${query}%`); // Search for usernames 
    setResults(data || []);
  };

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Search username..." 
        style={{ padding: '8px', borderRadius: '8px' }}
      />
      <button onClick={handleSearch}>Search</button>
      
      {results.map(profile => (
        <div key={profile.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <span>{profile.username}</span>
          <button 
            onClick={() => supabaseService.sendFriendRequest(profile.id)}
            style={{ background: 'linear-gradient(to right, #dc2626, #e11d48)', color: '#fff' }} // Matches your app's theme [cite: 67, 733]
          >
            Add Friend
          </button>
        </div>
      ))}
    </div>
  );
}