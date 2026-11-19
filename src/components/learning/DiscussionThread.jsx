'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Reply, Send } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DiscussionThread({ materialId }) {
  const { showToast } = useToast();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  const [replyTargetId, setReplyTargetId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchThreads = async () => {
    const res = await fetch(`/api/materials/${materialId}/discussions`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memuat diskusi materi.');
    }
    return json.data.discussions || [];
  };

  const loadDiscussions = async () => {
    setLoading(true);
    setError('');
    try {
      const items = await fetchThreads();
      setThreads(items);
    } catch (err) {
      setError(err.message || 'Gagal memuat diskusi materi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch(`/api/materials/${materialId}/discussions`)
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!active) return;
        if (!ok || !json.success) {
          throw new Error(json.error || 'Gagal memuat diskusi materi.');
        }
        setThreads(json.data.discussions || []);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Gagal memuat diskusi materi.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [materialId]);

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    const content = newQuestion.trim();
    if (content.length < 3) {
      showToast({ type: 'error', message: 'Pertanyaan minimal 3 karakter.' });
      return;
    }

    setSubmittingQuestion(true);
    try {
      const res = await fetch(`/api/materials/${materialId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengirim pertanyaan.');
      }

      setThreads((prev) => [json.data.post, ...prev]);
      setNewQuestion('');
      showToast({ type: 'success', message: 'Pertanyaan berhasil dikirim.' });
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal mengirim pertanyaan.' });
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault();
    const content = replyContent.trim();
    if (content.length < 3) {
      showToast({ type: 'error', message: 'Balasan minimal 3 karakter.' });
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/materials/${materialId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parent_id: parentId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengirim balasan.');
      }

      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === parentId
            ? { ...thread, replies: [...(thread.replies || []), json.data.post] }
            : thread
        )
      );
      setReplyContent('');
      setReplyTargetId(null);
      showToast({ type: 'success', message: 'Balasan berhasil dikirim.' });
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal mengirim balasan.' });
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <section
      aria-labelledby="discussion-heading"
      className="bg-white rounded-3xl border border-line p-6 sm:p-8 space-y-6"
    >
      <div className="flex items-center gap-2.5">
        <MessageSquare className="w-6 h-6 text-primary-hover" aria-hidden="true" />
        <h2 id="discussion-heading" className="font-heading text-xl font-semibold text-ink">
          Forum Diskusi Materi ({threads.length})
        </h2>
      </div>

      <form onSubmit={handleSubmitQuestion} className="space-y-3">
        <label htmlFor="new-discussion-question" className="block text-sm font-semibold text-ink">
          Ajukan pertanyaan atau catatan diskusi
        </label>
        <textarea
          id="new-discussion-question"
          rows={3}
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Tulis pertanyaan Anda mengenai materi ini..."
          className="w-full rounded-2xl border border-line-strong bg-page px-4 py-3 text-base text-ink placeholder:text-muted focus:bg-white focus:border-primary-hover"
        />
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={submittingQuestion}>
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>{submittingQuestion ? 'Mengirim...' : 'Kirim Pertanyaan'}</span>
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-base text-muted py-4">Memuat diskusi materi...</p>
      ) : error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger-light p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-danger-ink">{error}</p>
          <Button variant="outline" size="sm" onClick={loadDiscussions}>
            Muat Ulang
          </Button>
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-2xl border border-line bg-page p-6 text-center text-base text-muted">
          Belum ada diskusi pada materi ini. Jadilah yang pertama bertanya kepada pengajar.
        </div>
      ) : (
        <div className="space-y-5">
          {threads.map((thread) => (
            <div key={thread.id} className="rounded-2xl border border-line bg-page/50 p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Avatar src={thread.author_avatar} name={thread.author_name} size="md" />
                  <span className="font-semibold text-base text-ink">
                    {thread.author_name}
                  </span>
                  <StatusBadge status={thread.author_role} />
                </div>
                <span className="text-sm text-muted">{formatDateTime(thread.created_at)}</span>
              </div>

              <p className="text-base text-ink leading-relaxed whitespace-pre-line">
                {thread.content}
              </p>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTargetId(replyTargetId === thread.id ? null : thread.id);
                    setReplyContent('');
                  }}
                  className="min-h-11 px-3 -ml-3 rounded-full inline-flex items-center gap-1.5 text-sm font-semibold text-primary-dark hover:bg-primary-light transition"
                >
                  <Reply className="w-4 h-4" aria-hidden="true" />
                  <span>{replyTargetId === thread.id ? 'Batal Membalas' : 'Balas'}</span>
                </button>
              </div>

              {replyTargetId === thread.id && (
                <form
                  onSubmit={(e) => handleSubmitReply(e, thread.id)}
                  className="ml-4 sm:ml-8 pl-4 border-l-2 border-primary space-y-2.5"
                >
                  <label htmlFor={`reply-${thread.id}`} className="sr-only">
                    Tulis balasan
                  </label>
                  <textarea
                    id={`reply-${thread.id}`}
                    rows={2}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Tulis balasan Anda..."
                    className="w-full rounded-2xl border border-line-strong bg-white px-4 py-2.5 text-base text-ink"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTargetId(null)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" variant="primary" size="sm" loading={submittingReply}>
                      {submittingReply ? 'Mengirim...' : 'Kirim Balasan'}
                    </Button>
                  </div>
                </form>
              )}

              {thread.replies && thread.replies.length > 0 && (
                <div className="ml-4 sm:ml-8 pl-4 border-l-2 border-primary/35 space-y-3">
                  {thread.replies.map((reply) => (
                    <div key={reply.id} className="rounded-2xl bg-white border border-line p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Avatar src={reply.author_avatar} name={reply.author_name} size="xs" />
                          <span className="font-semibold text-sm text-ink">
                            {reply.author_name}
                          </span>
                          <StatusBadge status={reply.author_role} />
                        </div>
                        <span className="text-xs sm:text-sm text-muted">
                          {formatDateTime(reply.created_at)}
                        </span>
                      </div>
                      <p className="text-base text-ink leading-relaxed whitespace-pre-line">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
