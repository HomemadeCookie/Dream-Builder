import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Clock, CheckCircle2, Target, Flame, TrendingUp } from 'lucide-react'
import { Search, UserPlus } from 'lucide-react'

export default function FriendsFeed() {
  const [friends, setFriends] = useState([])
  const [friendsAreas, setFriendsAreas] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)

  const [pendingRequests, setPendingRequests] = useState([]);

  const fetchPendingRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Current user ID:', user.id);
      
      // Step 1: Get pending friendships where you are the friend_id
      const { data: friendships, error: friendshipsError } = await supabase
          .from('friendships')
          .select('id, user_id, friend_id, status')
          .eq('friend_id', user.id)
          .eq('status', 'pending');

      console.log('Pending friendships:', { friendships, error: friendshipsError });
      
      if (friendshipsError) {
        console.error("Friendships fetch error:", friendshipsError);
        return;
      }
      
      if (!friendships || friendships.length === 0) {
        console.log('No pending requests found');
        setPendingRequests([]);
        return;
      }
      
      // Step 2: Get profiles for the users who sent requests
      const senderIds = friendships.map(f => f.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', senderIds);
      
      console.log('Profiles:', { profiles, error: profilesError });
      
      if (profilesError) {
        console.error("Profiles fetch error:", profilesError);
        return;
      }
      
      // Step 3: Combine the data
      const requestsWithProfiles = friendships.map(req => ({
        id: req.id,
        user_id: req.user_id,
        profiles: profiles?.find(p => p.id === req.user_id) || { username: 'Unknown User' }
      }));
      
      console.log('Final requests with profiles:', requestsWithProfiles);
      setPendingRequests(requestsWithProfiles);
    } catch (err) {
      console.error('Error in fetchPendingRequests:', err);
    }
  };

  const handleRequest = async (requestId, newStatus) => {
    try {
      console.log('Handling request:', { requestId, newStatus });
      
      if (newStatus === 'accepted') {
        // Step 1: Get the friendship details
        const { data: friendship } = await supabase
          .from('friendships')
          .select('user_id, friend_id')
          .eq('id', requestId)
          .single();
        
        if (!friendship) {
          console.error('Friendship not found');
          return;
        }
        
        console.log('Friendship to accept:', friendship);
        
        // Step 2: Update the original request to 'accepted'
        const { error: updateError } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', requestId);
        
        if (updateError) {
          console.error('Error updating request:', updateError);
          return;
        }
        
        // Step 3: Create reciprocal friendship
        const { data: existingReciprocal } = await supabase
          .from('friendships')
          .select('id')
          .eq('user_id', friendship.friend_id)
          .eq('friend_id', friendship.user_id)
          .maybeSingle();
        
        console.log('Existing reciprocal:', existingReciprocal);
        
        if (!existingReciprocal) {
          // Create the reciprocal friendship
          const { error: reciprocalError } = await supabase
            .from('friendships')
            .insert({
              user_id: friendship.friend_id,
              friend_id: friendship.user_id,
              status: 'accepted'
            });
          
          if (reciprocalError) {
            console.error('Error creating reciprocal friendship:', reciprocalError);
            return;
          }
          
          console.log('Reciprocal friendship created');
        }
        
        console.log('Friendship accepted successfully');
      } else {
        // Just update the status for declined/other statuses
        const { error } = await supabase
          .from('friendships')
          .update({ status: newStatus })
          .eq('id', requestId);
        
        if (error) {
          console.error('Error updating request:', error);
          return;
        }
      }
      
      // Refresh both lists
      await fetchPendingRequests();
      await fetchFriendsAndAreas();
    } catch (err) {
      console.error('Error in handleRequest:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `%${searchQuery}%`)
      .limit(5);
    setSearchResults(data || []);
  };

  const sendRequest = async (friendId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('friendships')
      .insert({ user_id: user.id, friend_id: friendId, status: 'pending' });
    
    if (error) alert("Request already sent or error occurred.");
    else alert("Request sent!");
  };

  useEffect(() => {
    fetchFriendsAndAreas()
    fetchPendingRequests();

    // Listen for NEW friend requests or status changes
    const friendshipSubscription = supabase
      .channel('friendship-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        () => {
          console.log('Friendship change detected');
          fetchPendingRequests();
          fetchFriendsAndAreas();
        }
      )
      .subscribe();

    // Set up real-time subscription for areas updates
    const areasSubscription = supabase
      .channel('friends-areas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'areas'
        },
        () => {
          console.log('Area change detected');
          fetchFriendsAndAreas()
        }
      )
      .subscribe()

    return () => {
      areasSubscription.unsubscribe()
      friendshipSubscription.unsubscribe();
    }
  }, [])

  const fetchFriendsAndAreas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('Fetching friends for user:', user.id);
      
      // Get list of accepted friendships where user is either user_id OR friend_id
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted')

      console.log('Friendships found:', friendships);

      if (friendshipsError) {
        console.error('Error fetching friendships:', friendshipsError);
        setFriends([]);
        setFriendsAreas([]);
        setLoading(false);
        return;
      }

      if (friendships && friendships.length > 0) {
        // Extract friend IDs (could be in either user_id or friend_id column)
        const friendIds = friendships.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        ).filter(id => id !== user.id);
        
        console.log('Friend IDs:', friendIds);
        
        if (friendIds.length === 0) {
          setFriends([]);
          setFriendsAreas([]);
          setLoading(false);
          return;
        }
        
        // Get profiles for all friends
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', friendIds)

        console.log('Friend profiles:', profiles);
        setFriends(profiles || [])
        
        // Get areas for all friends with their next steps
        const { data: areas } = await supabase
          .from('areas')
          .select(`
            *,
            next_steps (
              id,
              content,
              completed,
              order_index
            )
          `)
          .in('user_id', friendIds)
          .neq('visibility', 'private')
          .order('last_activity', { ascending: false })

        console.log('Friend areas:', areas);

        if (areas) {
          // Attach profile info to each area
          const areasWithProfiles = areas.map(area => ({
            ...area,
            profiles: profiles?.find(p => p.id === area.user_id)
          }))
          console.log('Areas with profiles:', areasWithProfiles);
          setFriendsAreas(areasWithProfiles)
        }
      } else {
        console.log('No friendships found');
        setFriends([]);
        setFriendsAreas([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group areas by friend
  const areasByFriend = friendsAreas.reduce((acc, area) => {
    const userId = area.user_id
    if (!acc[userId]) {
      acc[userId] = {
        user: area.profiles,
        areas: []
      }
    }
    acc[userId].areas.push(area)
    return acc
  }, {})

  if (loading) {
    return (
      <div style={{ padding: '20px', color: '#fff' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          Loading friends' progress...
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#000', color: '#fff', paddingBottom: '100px' }}>
      
      {/* PENDING REQUESTS - MOVED TO TOP */}
      {pendingRequests.length > 0 && (
        <div style={{ 
            marginBottom: '24px', 
            padding: '20px', 
            background: 'linear-gradient(to bottom right, rgba(220, 38, 38, 0.2), rgba(225, 29, 72, 0.2))', 
            border: '2px solid #dc2626', 
            borderRadius: '16px',
            animation: 'pulse 2s infinite'
        }}>
          <h3 style={{ 
            marginBottom: '16px', 
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔔 Friend Requests ({pendingRequests.length})
          </h3>
          {pendingRequests.map(req => (
            <div key={req.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '12px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(to bottom right, #dc2626, #e11d48)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  {req.profiles?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{req.profiles?.username || 'Unknown'}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>wants to be friends</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => handleRequest(req.id, 'accepted')}
                  style={{ 
                    padding: '8px 16px', 
                    background: 'linear-gradient(to right, #22c55e, #16a34a)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#fff', 
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Accept
                </button>
                <button 
                  onClick={() => handleRequest(req.id, 'declined')}
                  style={{ 
                    padding: '8px 16px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: '8px', 
                    color: '#fff', 
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Ignore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
        
      {/* SEARCH SECTION */}
      <div style={{ marginBottom: '32px' }}>
        <button 
          onClick={() => setShowSearch(!showSearch)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
            color: '#fff', cursor: 'pointer'
          }}
        >
          <Search size={18} /> {showSearch ? 'Close Search' : 'Find Friends'}
        </button>

        {showSearch && (
          <div style={{ 
            marginTop: '16px', padding: '20px', background: '#111', 
            borderRadius: '16px', border: '1px solid #dc2626' 
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                placeholder="Enter username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, padding: '12px', background: '#000', border: '1px solid #333',
                  borderRadius: '8px', color: '#fff'
                }}
              />
              <button onClick={handleSearch} style={{ padding: '0 20px', borderRadius: '8px', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}>
                Search
              </button>
            </div>

            <div style={{ marginTop: '16px' }}>
              {searchResults.map(result => (
                <div key={result.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                      {result.username.charAt(0).toUpperCase()}
                    </div>
                    <span>{result.username}</span>
                  </div>
                  <button 
                    onClick={() => sendRequest(result.id)}
                    style={{ background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <UserPlus size={14} /> Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          background: 'linear-gradient(to right, #fff, #dc2626)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Friends' Progress
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>
          See what your friends are working on
        </p>
        
        {Object.values(areasByFriend).map(({ user, areas }) => (
          <div key={user.id} style={{ 
            marginBottom: '40px', 
            padding: '24px', 
            background: 'linear-gradient(to bottom right, rgba(26, 26, 26, 0.8), rgba(38, 38, 38, 0.8))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px'
          }}>
            {/* User Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.display_name}
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    marginRight: '12px',
                    border: '2px solid rgba(220, 38, 38, 0.3)'
                  }}
                />
              ) : (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(to bottom right, #dc2626, #e11d48)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginRight: '12px'
                }}>
                  {(user.display_name || user.username).charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '2px' }}>
                  {user.display_name || user.username}
                </h2>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>@{user.username}</p>
              </div>
            </div>

            {/* Areas Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '16px' 
            }}>
              {areas.map(area => {
                const completedToday = area.next_steps?.filter(s => s.completed).length || 0
                const totalSteps = area.next_steps?.length || 0

                return (
                  <div key={area.id} style={{ 
                    padding: '20px', 
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                  >
                    {/* Icon and Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '32px' }}>{area.icon}</div>
                      <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{area.name}</h3>
                    </div>

                    {/* Current Goal */}
                    {area.goal && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'start', 
                        gap: '8px', 
                        marginBottom: '16px',
                        padding: '12px',
                        background: 'rgba(220, 38, 38, 0.1)',
                        border: '1px solid rgba(220, 38, 38, 0.2)',
                        borderRadius: '8px'
                      }}>
                        <Target size={16} color="#fca5a5" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#d1d5db',
                          lineHeight: '1.4',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {area.goal}
                        </div>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      {/* Progress */}
                      <div style={{ 
                        padding: '8px', 
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>Progress</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{area.progress}%</div>
                      </div>

                      {/* Time Spent */}
                      <div style={{ 
                        padding: '8px', 
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '10px', 
                          color: '#6b7280', 
                          marginBottom: '4px' 
                        }}>
                          <Clock size={10} />
                          Time
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{area.time_spent}h</div>
                      </div>

                      {/* Streak */}
                      <div style={{ 
                        padding: '8px', 
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '10px', 
                          color: '#6b7280', 
                          marginBottom: '4px' 
                        }}>
                          <Flame size={10} />
                          Streak
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{area.streak}</div>
                      </div>

                      {/* Done Today */}
                      <div style={{ 
                        padding: '8px', 
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '10px', 
                          color: '#6b7280', 
                          marginBottom: '4px' 
                        }}>
                          <CheckCircle2 size={10} />
                          Today
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                          {completedToday}/{totalSteps}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: '999px', 
                      overflow: 'hidden',
                      marginTop: '8px'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${area.progress}%`,
                        background: 'linear-gradient(to right, #dc2626, #e11d48)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>

                    {/* Last Activity */}
                    {area.last_activity && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#6b7280', 
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <TrendingUp size={10} />
                        Last active: {new Date(area.last_activity).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {Object.keys(areasByFriend).length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No friends yet</h3>
            <p style={{ color: '#6b7280' }}>Add friends to see their progress!</p>
          </div>
        )}
      </div>
      
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.9;
            }
          }
        `}
      </style>
    </div>
  )
}