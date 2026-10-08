import React, { useState, useEffect } from 'react';
import { 
  Heart, Sparkles, Calendar, MessageSquare, Send, ShieldAlert,
  ThumbsUp, Lock, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { User, KudosPost, VentThread, DailyMood, DailyWidget } from '../types';

interface StudentPortalProps {
  currentUser: User;
  onShowToast: (message: string, type: 'error' | 'success' | 'warning', title?: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ currentUser, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'kudos' | 'vent'>('calendar');

  // Daily Widget state
  const [dailyWidget, setDailyWidget] = useState<DailyWidget | null>(null);

  // Mood Calendar state
  const [moods, setMoods] = useState<DailyMood[]>([]);
  const [selectedScore, setSelectedScore] = useState<number>(4);
  const [moodNote, setMoodNote] = useState<string>('');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<DailyMood | null>(null);

  // Kudos Wall state
  const [kudosList, setKudosList] = useState<KudosPost[]>([]);
  const [kudosRecipient, setKudosRecipient] = useState('');
  const [kudosMessage, setKudosMessage] = useState('');
  const [kudosCategory, setKudosCategory] = useState<'APPRECIATION' | 'KINDNESS' | 'TEAMWORK' | 'ENCOURAGEMENT'>('APPRECIATION');
  const [showKudosModal, setShowKudosModal] = useState(false);
  const [kudosFilter, setKudosFilter] = useState('ALL');

  // Vent Space state
  const [ventThread, setVentThread] = useState<VentThread | null>(null);
  const [ventInput, setVentInput] = useState('');
  const [comfortMode, setComfortMode] = useState<string>('INSPIRATIONAL_QUOTE');

  useEffect(() => {
    loadAllData();
  }, [currentUser.id]);

  const loadAllData = async () => {
    try {
      const [widgetData, moodData, kudosData, ventData] = await Promise.all([
        api.getDailyWidget().catch(() => null),
        api.getMoodCalendar(currentUser.id).catch(() => []),
        api.getKudos().catch(() => []),
        api.getVentThread().catch(() => null),
      ]);

      if (widgetData) setDailyWidget(widgetData);
      if (moodData) setMoods(moodData);
      if (kudosData) setKudosList(kudosData);
      if (ventData) {
        setVentThread(ventData);
        setComfortMode(ventData.comfort_preference || 'INSPIRATIONAL_QUOTE');
      }
    } catch (err) {
      console.error('Failed to load student data', err);
    }
  };

  // -------------------------------------------------------------
  // Mood Calendar Handlers
  // -------------------------------------------------------------
  const todayStr = new Date().toISOString().split('T')[0];

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await api.submitMoodCheckIn({
        check_date: todayStr,
        score: selectedScore,
        note: moodNote,
      });
      onShowToast('Your daily mood check-in has been recorded!', 'success', 'Mood Check-in');
      setMoods(prev => {
        const filtered = prev.filter(m => m.check_date !== todayStr);
        return [...filtered, saved];
      });
      setMoodNote('');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to submit mood', 'error');
    }
  };

  const getEmojiByScore = (score: number) => {
    switch (score) {
      case 1: return { emoji: '😫', label: 'Distressed', color: 'bg-rose-100 text-rose-700 border-rose-300' };
      case 2: return { emoji: '😔', label: 'Low', color: 'bg-amber-100 text-amber-700 border-amber-300' };
      case 3: return { emoji: '😐', label: 'Neutral', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 4: return { emoji: '🙂', label: 'Good', color: 'bg-sky-100 text-sky-700 border-sky-300' };
      case 5: return { emoji: '🌟', label: 'Great', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
      default: return { emoji: '⚪', label: 'None', color: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
  };

  // Build calendar matrix for current month
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const moodEntry = moods.find(m => m.check_date === formattedDate);
    return { dayNum, formattedDate, moodEntry };
  });

  // -------------------------------------------------------------
  // Kudos Wall Handlers
  // -------------------------------------------------------------
  const handlePostKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kudosMessage.trim()) return;

    try {
      const newPost = await api.postKudos({
        recipient_name: kudosRecipient,
        message: kudosMessage,
        category: kudosCategory,
      });
      setKudosList([newPost, ...kudosList]);
      setKudosRecipient('');
      setKudosMessage('');
      setShowKudosModal(false);
      onShowToast('Your positive Kudos has been posted to the wall!', 'success', 'Kudos Posted');
    } catch (err: any) {
      onShowToast(
        err.message || 'Harmful words detected. The Kudos Wall is reserved for uplifting messages only.',
        'error',
        'Harmful Words Detected'
      );
    }
  };

  const filteredKudos = kudosList.filter(k => kudosFilter === 'ALL' || k.category === kudosFilter);

  // -------------------------------------------------------------
  // Vent Space Handlers
  // -------------------------------------------------------------
  const handleSendVentMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ventInput.trim() || !ventThread) return;

    try {
      const msg = await api.sendVentMessage({
        thread_id: ventThread.id,
        message: ventInput,
      });
      setVentThread({
        ...ventThread,
        messages: [...(ventThread.messages || []), msg],
      });
      setVentInput('');
      onShowToast('Message delivered privately to Guidance Counselor.', 'success', 'Vent Space');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to send message', 'error');
    }
  };

  const handleUpdateComfort = async (mode: string) => {
    setComfortMode(mode);
    try {
      await api.updateComfortPreference(mode);
      onShowToast('Comfort theme updated.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const comfortSnippets: Record<string, { quote: string; verse: string; reflection: string }> = {
    BIBLE_VERSE: {
      quote: '"The Lord is close to the brokenhearted and saves those who are crushed in spirit."',
      verse: 'Psalm 34:18',
      reflection: 'Take three slow deep breaths. You are safe, supported, and never facing this alone.',
    },
    INSPIRATIONAL_QUOTE: {
      quote: '"You do not have to carry everything all at once. One moment, one breath at a time is enough."',
      verse: 'Self-Compassion Reminder',
      reflection: 'Remember that expressing pain is a sign of courage, not weakness.',
    },
    MINDFULNESS: {
      quote: '"Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste."',
      verse: '5-4-3-2-1 Grounding Practice',
      reflection: 'Bring your awareness gently to this present moment. You have the resilience to move forward.',
    },
  };

  const activeComfort = comfortSnippets[comfortMode] || comfortSnippets.INSPIRATIONAL_QUOTE;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Daily Widget: Verse / Word of the Day */}
      {dailyWidget && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 shadow-xl border border-indigo-700/50">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {dailyWidget.category.replace('_', ' ')}
                </span>
                <span className="text-xs text-indigo-200">Daily Inspiration Widget</span>
              </div>
              <p className="text-lg md:text-xl font-medium tracking-wide italic leading-relaxed text-indigo-50">
                "{dailyWidget.quote_text}"
              </p>
              {dailyWidget.source_attribution && (
                <p className="text-xs font-semibold text-amber-300/90">— {dailyWidget.source_attribution}</p>
              )}
            </div>
            <div className="hidden lg:flex flex-col items-end text-xs text-indigo-300 bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
              <span className="font-semibold text-white">Student Wellness Corner</span>
              <span>Available 24/7 for support</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'calendar'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Mood Check-In</span>
        </button>
        <button
          onClick={() => setActiveTab('kudos')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'kudos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Kudos Wall (Good Vibes)</span>
        </button>
        <button
          onClick={() => setActiveTab('vent')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'vent'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4 text-purple-600" />
          <span>Vent Space (Confidential)</span>
        </button>
      </div>

      {/* 2. TAB: Daily Mood Check-In (Interactive Clickable Calendar) */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Interactive Month Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Monthly Mood Calendar</h2>
                <p className="text-xs text-slate-500">
                  {currentDate.toLocaleString('default', { month: 'long' })} {currentYear} — Click any date to view reflections
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">🌟 Great</span>
                <span className="flex items-center gap-1">🙂 Good</span>
                <span className="flex items-center gap-1">😐 Neutral</span>
                <span className="flex items-center gap-1">😔 Low</span>
                <span className="flex items-center gap-1">😫 Distressed</span>
              </div>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-16 rounded-xl bg-slate-50/50 border border-transparent" />
              ))}

              {daysArray.map(({ dayNum, formattedDate, moodEntry }) => {
                const isToday = formattedDate === todayStr;
                const moodData = moodEntry ? getEmojiByScore(moodEntry.score) : null;

                return (
                  <button
                    key={formattedDate}
                    onClick={() => {
                      if (moodEntry) {
                        setSelectedCalendarDay(moodEntry);
                      } else {
                        setSelectedCalendarDay({
                          id: 0,
                          student_id: currentUser.id,
                          check_date: formattedDate,
                          score: 0,
                          note: 'No check-in recorded for this day.',
                        });
                      }
                    }}
                    className={`h-16 rounded-xl p-1.5 flex flex-col justify-between items-center transition border ${
                      isToday
                        ? 'ring-2 ring-indigo-500 bg-indigo-50/50'
                        : 'hover:bg-slate-50 bg-white'
                    } ${moodData ? moodData.color : 'border-slate-100'}`}
                  >
                    <span className={`text-[11px] font-bold ${isToday ? 'text-indigo-700' : 'text-slate-600'}`}>
                      {dayNum}
                    </span>
                    {moodData ? (
                      <span className="text-xl leading-none" title={moodData.label}>
                        {moodData.emoji}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300">—</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Reflection Box */}
            {selectedCalendarDay && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Record for {selectedCalendarDay.check_date}</span>
                  {selectedCalendarDay.score > 0 && (
                    <span className="font-semibold text-indigo-700">
                      Score: {selectedCalendarDay.score}/5 ({getEmojiByScore(selectedCalendarDay.score).label})
                    </span>
                  )}
                </div>
                <p className="text-slate-600 italic">
                  "{selectedCalendarDay.note || 'No notes left for this date.'}"
                </p>
              </div>
            )}
          </div>

          {/* Today's Check-In Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">How are you feeling today?</h3>
              <p className="text-xs text-slate-500">
                Log your daily mood check-in. Confidential and private.
              </p>
            </div>

            <form onSubmit={handleMoodSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Choose Mood Level</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { score: 1, emoji: '😫', label: 'Distressed' },
                    { score: 2, emoji: '😔', label: 'Low' },
                    { score: 3, emoji: '😐', label: 'Neutral' },
                    { score: 4, emoji: '🙂', label: 'Good' },
                    { score: 5, emoji: '🌟', label: 'Great' },
                  ].map(item => (
                    <button
                      type="button"
                      key={item.score}
                      onClick={() => setSelectedScore(item.score)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${
                        selectedScore === item.score
                          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-400'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-[10px] font-semibold text-slate-700">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reflection or Thoughts (Optional)</label>
                <textarea
                  rows={3}
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="What influenced your mood today? Classes, sleep, social, or friends..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Save Today's Check-In</span>
              </button>
            </form>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Need to talk in confidence? You can also message your guidance counselor anytime in the{' '}
                <strong>Vent Space</strong> tab.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: Kudos Wall */}
      {activeTab === 'kudos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>The Kudos Wall</span>
              </h2>
              <p className="text-xs text-slate-500">
                A safe and uplifting board to celebrate kindness, teamwork, and positive energy on campus.
              </p>
            </div>
            <button
              onClick={() => setShowKudosModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Send Kudos / Shoutout</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {['ALL', 'APPRECIATION', 'KINDNESS', 'TEAMWORK', 'ENCOURAGEMENT'].map(cat => (
              <button
                key={cat}
                onClick={() => setKudosFilter(cat)}
                className={`px-3 py-1.5 rounded-full font-semibold border transition ${
                  kudosFilter === cat
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKudos.map(post => (
              <div
                key={post.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      To: {post.recipient_name || 'Everyone'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "{post.message}"
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>From: {post.sender ? `${post.sender.first_name} ${post.sender.last_name}` : 'Peer'}</span>
                  <span className="text-rose-500 font-semibold uppercase text-[10px]">{post.category}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal */}
          {showKudosModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Send Positive Kudos</span>
                  </h3>
                  <button
                    onClick={() => setShowKudosModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-900 leading-relaxed">
                  🛡️ <strong>Safety Rule:</strong> All posts are scanned in real-time. Any hostile, violent, profane, or bullying words will be blocked automatically.
                </div>

                <form onSubmit={handlePostKudos} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Who is this for? (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Elena Cruz, Grade 9 Diamond, or Best Friends"
                      value={kudosRecipient}
                      onChange={(e) => setKudosRecipient(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Category</label>
                    <select
                      value={kudosCategory}
                      onChange={(e: any) => setKudosCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="APPRECIATION">Appreciation</option>
                      <option value="KINDNESS">Kindness</option>
                      <option value="TEAMWORK">Teamwork</option>
                      <option value="ENCOURAGEMENT">Encouragement</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Your Positive Message</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Write your encouraging words here..."
                      value={kudosMessage}
                      onChange={(e) => setKudosMessage(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowKudosModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                    >
                      Post to Wall
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB: Vent Space */}
      {activeTab === 'vent' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px] overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-400 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>Vent Space — Confidential Channel</span>
                    <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-semibold">
                      Encrypted / RA 10173
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Handled by: {ventThread?.counselor ? `${ventThread.counselor.first_name} ${ventThread.counselor.last_name} (Guidance Counselor)` : 'Assigned Guidance Counselor'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 px-4 py-2 text-[11px] text-purple-900 border-b border-purple-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Confidentiality Notice:</strong> Messages shared here are visible solely to you and your assigned guidance counselor. Homeroom teachers and peers do not have access.
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
              {ventThread?.messages && ventThread.messages.length > 0 ? (
                ventThread.messages.map((m) => {
                  const isMe = m.sender_id === currentUser.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-400 mb-1 px-1">
                        {isMe ? 'You' : m.sender ? `${m.sender.first_name} ${m.sender.last_name}` : 'Counselor'} •{' '}
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                  <p className="text-xs">No messages yet. Send a message to start communicating with your counselor.</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSendVentMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                placeholder="Share your thoughts, feelings, or request a talk..."
                value={ventInput}
                onChange={(e) => setVentInput(e.target.value)}
                className="flex-1 text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Comfort Message Mode</span>
                </h3>
                <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">
                  Personalized
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Choose the kind of comforting reflection you prefer when feeling down:
              </p>

              <div className="grid grid-cols-1 gap-2 text-xs">
                {[
                  { id: 'BIBLE_VERSE', label: 'Scripture & Faith Verses', desc: 'Encouraging biblical wisdom' },
                  { id: 'INSPIRATIONAL_QUOTE', label: 'Inspirational Quotes', desc: 'Strength & resilience words' },
                  { id: 'MINDFULNESS', label: 'Grounding & Mindfulness', desc: 'Calming sensory exercises' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleUpdateComfort(opt.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      comfortMode === opt.id
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-300'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold text-slate-800">{opt.label}</div>
                    <div className="text-[11px] text-slate-500">{opt.desc}</div>
                  </button>
                ))}
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-purple-900">{activeComfort.verse}</div>
                <p className="italic text-slate-700">"{activeComfort.quote}"</p>
                <div className="text-[11px] text-purple-800 pt-1 border-t border-purple-200/60 font-medium">
                  {activeComfort.reflection}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2 text-xs">
              <div className="font-bold text-slate-800">Guidance & Counseling Office</div>
              <p className="text-slate-600">Location: Room 204, Administration Wing</p>
              <p className="text-slate-600">Hours: Monday to Friday, 8:00 AM – 5:00 PM</p>
              <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200">
                Walk-ins are always welcome during break and lunch hours.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
