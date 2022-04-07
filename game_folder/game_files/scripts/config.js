const GAME_PATH = '/game';
const ROOM_CAPACITY = 4;

const ICE_SERVERS = 
[
  { 
    urls: 'stun:stun.l.google.com:19302' 
  },
  
  { 
    urls: 'stun:stun1.l.google.com:19302'
  },
]

const DATA_CHANNEL_NAME = 'data';

const Message = 
{
	GET_ROOM_LIST: 'get_room_list', // Request all available rooms
	ROOM_LIST: 'room_list', // All available rooms

	ROOM_JOIN: 'room_join', // Request from the player to join a room
	ROOM_LEAVE: 'room_leave', // Request from the player to leave a room
  ROOM_JOINED: 'room_joined', // Room joined message
  ROOM_NEW: 'room_new', //message to create a new room and join it from a player
	ROOM_INFO: 'room_info', // Room info responce on ROOM_JOIN or ROOM_NEW

  GAME_STARTED: 'game_started',
  GAME_ENDED: 'game_ended',
	
	PLAYER_JOIN: 'player_join', // When remote player joins a room
	PLAYER_READY: 'player_ready', // When remote player in a room is ready
	PLAYER_LEAVE: 'player_leave', // When remote player leaves a room
  
  PICKING_ORDER: 'picking_order', //

	SDP: 'sdp', // When SDP from a remote player arrives
	ICE_CANDIDATE: 'ice_candidate', // When ICE candidate from a remote player arrives

	ERROR_FULL_ROOM: 'error_full_room', // Error message on full room
	ERROR_PLAYER_WAS_INITIALIZED: 'error_player_was_initialized', // Error message on duplicate auth attempt
  ERROR_ROOM_EXIST: 'error_room_exists', // Error message on duplicate room creation
  ERROR_ROOM_NOEXIST: 'error_room_no_exists', // Error message on trying to join an unexisting room
  ERROR_GAME_STARTED: 'error_game_started',
    // WebRTC defines these names, so do not change
  WEBRTC_ICE_CANDIDATE: 'icecandidate',
  WEBRTC_ICE_STATE_CHANGE: 'iceconnectionstatechange',
  WEBRTC_DATA_CHANNEL: 'datachannel',

  // WebRTC defines these names, so do not change
  PEER_OPEN: 'open',
  PEER_CLOSE: 'close',
  PEER_MESSAGE: 'message'
};