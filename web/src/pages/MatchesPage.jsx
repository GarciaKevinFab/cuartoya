import { useEffect, useState, useRef } from 'react';
import { useMatchesStore } from '../store/matchesStore';
import { useAuthStore } from '../store/authStore';
import { useChat } from '../hooks/useChat';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Search,
  MapPin,
  Banknote,
  Check,
  CheckCheck,
  Image,
  Smile,
  MoreVertical,
  Home,
  Loader2,
} from 'lucide-react';

dayjs.extend(relativeTime);
dayjs.locale('es');

export default function MatchesPage() {
  const {
    matches,
    activeMatchId,
    messages,
    isLoading,
    isLoadingMessages,
    fetchMatches,
    setActiveMatch,
    sendMessage,
  } = useMatchesStore();
  const { user } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useChat();

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessage(messageText);
    setMessageText('');
    inputRef.current?.focus();
  };

  const activeMatch = matches.find((m) => m._id === activeMatchId);

  const filteredMatches = matches.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const otherName = (m.listing?.title || m.otherUser?.name || '').toLowerCase();
    return otherName.includes(q);
  });

  const formatTime = (date) => {
    if (!date) return '';
    const d = dayjs(date);
    const now = dayjs();
    if (d.isSame(now, 'day')) return d.format('HH:mm');
    if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Ayer';
    return d.format('DD/MM');
  };

  return (
    <div className="h-[calc(100vh-64px)] lg:h-screen flex">
      {/* Matches list */}
      <div
        className={`w-full lg:w-96 border-r border-gray-100 flex flex-col bg-white ${
          activeMatchId ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversacion..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Matches list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Sin matches todavia</p>
              <p className="text-gray-400 text-sm mt-1">
                Desliza a la derecha en cuartos que te interesen
              </p>
            </div>
          ) : (
            filteredMatches.map((match) => {
              const otherUser = match.otherUser || {};
              const listing = match.listing || {};
              const lastMsg = match.lastMessage;
              const isActive = match._id === activeMatchId;

              return (
                <button
                  key={match._id}
                  onClick={() => setActiveMatch(match._id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${
                    isActive ? 'bg-primary-light/50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                      {listing.photos?.[0] ? (
                        <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary-light flex items-center justify-center">
                          <Home className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </div>
                    {match.unread && (
                      <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-semibold text-sm truncate ${match.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {listing.title || otherUser.name || 'Match'}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {formatTime(lastMsg?.createdAt || match.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {listing.price && (
                        <span className="text-xs text-primary font-medium">S/{listing.price}</span>
                      )}
                      {listing.price && lastMsg && <span className="text-gray-300 text-xs">·</span>}
                      <p className={`text-xs truncate ${match.unread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                        {lastMsg?.text || 'Nuevo match - envia un mensaje'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div
        className={`flex-1 flex flex-col bg-gray-50 ${
          activeMatchId ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {activeMatch ? (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setActiveMatch(null)}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                {activeMatch.listing?.photos?.[0] ? (
                  <img src={activeMatch.listing.photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-light flex items-center justify-center">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {activeMatch.listing?.title || activeMatch.otherUser?.name || 'Chat'}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {activeMatch.listing?.district && (
                    <>
                      <MapPin className="w-3 h-3" />
                      <span>{activeMatch.listing.district}</span>
                    </>
                  )}
                  {activeMatch.listing?.price && (
                    <>
                      <span className="mx-1">·</span>
                      <Banknote className="w-3 h-3" />
                      <span>S/{activeMatch.listing.price}/mes</span>
                    </>
                  )}
                </div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-3">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-gray-500 font-medium">Inicio de la conversacion</p>
                  <p className="text-gray-400 text-sm mt-1">Envia el primer mensaje</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender === 'me' || msg.sender === user?._id;
                    const showDate = idx === 0 || !dayjs(msg.createdAt).isSame(dayjs(messages[idx - 1]?.createdAt), 'day');

                    return (
                      <div key={msg._id || idx}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">
                              {dayjs(msg.createdAt).format('DD MMM YYYY')}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                              isMe
                                ? 'bg-primary text-white rounded-br-md'
                                : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                            } ${msg.pending ? 'opacity-60' : ''} ${msg.failed ? 'border-2 border-red-300' : ''}`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                                {dayjs(msg.createdAt).format('HH:mm')}
                              </span>
                              {isMe && !msg.pending && (
                                msg.read
                                  ? <CheckCheck className="w-3 h-3 text-white/60" />
                                  : <Check className="w-3 h-3 text-white/60" />
                              )}
                              {msg.failed && (
                                <span className="text-[10px] text-red-300 ml-1">Error</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message input */}
            <form
              onSubmit={handleSend}
              className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Tus mensajes</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">
              Selecciona un match para empezar a chatear con el propietario
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
