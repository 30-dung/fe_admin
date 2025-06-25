// src/pages/Admin/AdminFeedbackPage.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '@/service/api';
import url from '@/service/url';
import { useAuth } from '@/context/AuthContext';

// Định nghĩa interface cho một đối tượng Feedback
interface Feedback {
  id: number;
  name: string;
  email: string;
  comment: string;
  reply: string | null;
  createdAt: string; // ISO 8601 string
  repliedAt: string | null; // ISO 8601 string
}

const AdminFeedbackPage: React.FC = () => {
  const { auth, isLoadingAuth } = useAuth();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState<string>(''); // Nội dung phản hồi cho góp ý đang chọn
  const [replyLoading, setReplyLoading] = useState<boolean>(false); // Loading state cho việc gửi phản hồi
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null); // ID của góp ý đang được chọn để xem/trả lời

  const checkAdminRole = (): boolean => {
    return auth.isAuthenticated && auth.role?.includes("ROLE_ADMIN") || false;
  };

  const fetchFeedback = async () => {
    if (!checkAdminRole()) {
      setError('Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với tài khoản quản trị.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.get(url.FEEDBACK.GET_ALL);
      const data: Feedback[] = response.data;
      const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFeedbackList(sortedData);
    } catch (err) {
      console.error('Lỗi khi tải góp ý:', err);
      setError('Không thể tải danh sách góp ý. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingAuth) {
      if (auth.isAuthenticated && auth.role) {
        fetchFeedback();
      } else {
        setLoading(false);
        setError('Vui lòng đăng nhập với tài khoản quản trị để xem trang này.');
      }
    }
  }, [auth.isAuthenticated, auth.role, isLoadingAuth]);

  // Hàm chọn một góp ý để hiển thị chi tiết
  const handleSelectFeedback = (id: number) => {
    setSelectedFeedbackId(id);
    const selectedFeedback = feedbackList.find(fb => fb.id === id);
    if (selectedFeedback && selectedFeedback.reply) {
      setReplyContent(selectedFeedback.reply); // Nếu đã có phản hồi, điền vào input (chỉ để hiển thị, không cho sửa)
    } else {
      setReplyContent(''); // Xóa nội dung nếu chưa có phản hồi
    }
  };

  // Hàm đóng chi tiết góp ý
  const handleCloseDetail = () => {
    setSelectedFeedbackId(null);
    setReplyContent(''); // Xóa nội dung phản hồi khi đóng
  };

  // Xử lý gửi phản hồi
  const handleReplySubmit = async () => {
    if (!checkAdminRole()) {
      toast.error('Bạn không có quyền thực hiện hành động này.');
      return;
    }

    setReplyLoading(true);
    const content = replyContent;

    if (!content || content.trim() === '') {
      toast.error('Nội dung phản hồi không được để trống.');
      setReplyLoading(false);
      return;
    }

    try {
      const response = await api.post(`${url.FEEDBACK.REPLY}/${selectedFeedbackId}/reply`, { replyContent: content });
      const updatedFeedback: Feedback = response.data;

      setFeedbackList((prev) =>
        prev.map((fb) => (fb.id === selectedFeedbackId ? { ...fb, reply: updatedFeedback.reply, repliedAt: updatedFeedback.repliedAt } : fb))
      );
      toast.success('Phản hồi đã được gửi và email đã được gửi đến khách hàng.');
      setReplyContent(updatedFeedback.reply || ''); // Cập nhật lại nội dung phản hồi hiển thị
      // Không đóng chi tiết ngay, để người dùng thấy phản hồi đã được gửi
    } catch (err) {
      console.error('Lỗi khi phản hồi góp ý:', err);
      toast.error('Gửi phản hồi thất bại. Vui lòng thử lại.');
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Đang tải góp ý...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-xl text-red-600 text-center px-4">{error}</p>
      </div>
    );
  }

  if (!checkAdminRole()) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-xl text-red-600 text-center px-4">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  const selectedFeedback = feedbackList.find(fb => fb.id === selectedFeedbackId);

  return (
    <div className="min-h-screen bg-{#F9FAFB} from-blue-50 to-indigo-100 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-10 border border-blue-200 flex flex-col lg:flex-row">
        {/* Cột trái: Danh sách góp ý */}
        <div className={`flex-1 ${selectedFeedbackId ? 'lg:w-1/2' : 'lg:w-full'} overflow-y-auto pr-4 lg:pr-8`}>
          <h2 className="text-3xl font-extrabold text-blue-700 mb-8 sticky top-0 bg-white pt-2 pb-4 z-10 border-b border-gray-200">
            Hộp thư Góp ý
            <span className="block w-16 h-1 bg-blue-500 mt-2 rounded-full"></span>
          </h2>

          {feedbackList.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.11C6.219 15.17 9.28 14 12 14c4.97 0 9-3.582 9-8s-4.03-8-9-8-9 3.582-9 8c0 1.02.213 2.001.622 2.918L3 17l1.395-3.11C6.219 15.17 9.28 14 12 14z" />
                </svg>
                Hiện chưa có góp ý nào từ khách hàng.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {feedbackList.map((feedback) => (
                <div
                  key={feedback.id}
                  className={`flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedFeedbackId === feedback.id ? 'bg-blue-50 border-blue-400 shadow-md' : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectFeedback(feedback.id)}
                >
                  {/* Icon cho trạng thái đã đọc/chưa đọc (tùy chọn) */}
                  {/* <div className="mr-3 text-gray-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div> */}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-gray-900">{feedback.name} ({feedback.email})</p>
                      <p className="text-xs text-gray-500">{new Date(feedback.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-gray-700 truncate">{feedback.comment}</p> {/* truncate để cắt gọn nội dung */}
                    {feedback.reply && (
                      <p className="text-xs text-green-600 mt-1">Đã phản hồi</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột phải: Chi tiết góp ý và form trả lời */}
        {selectedFeedbackId && selectedFeedback && (
          <div className="lg:w-1/2 mt-8 lg:mt-0 lg:ml-8 p-6 bg-white rounded-xl shadow-lg border border-blue-200 flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-blue-700">Chi tiết Góp ý</h3>
              <button
                onClick={handleCloseDetail}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                title="Đóng"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 pb-4"> {/* Thêm overflow để cuộn nội dung */}
              <p className="text-lg font-semibold text-gray-800">
                Từ: {selectedFeedback.name} &lt;{selectedFeedback.email}&gt;
              </p>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Gửi lúc: {new Date(selectedFeedback.createdAt).toLocaleString()}
              </p>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <p className="font-semibold text-blue-800 mb-1">Nội dung góp ý:</p>
                <p className="text-gray-700 leading-relaxed">{selectedFeedback.comment}</p>
              </div>

              {selectedFeedback.reply ? (
                // Nếu đã có phản hồi, chỉ hiển thị nội dung phản hồi
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 mt-4">
                  <p className="font-semibold text-green-700 mb-1">Phản hồi của bạn:</p>
                  <p className="text-gray-700 leading-relaxed">{selectedFeedback.reply}</p>
                  <p className="text-xs text-gray-400 mt-1">Phản hồi lúc: {new Date(selectedFeedback.repliedAt!).toLocaleString()}</p>
                </div>
              ) : (
                // Nếu chưa có phản hồi, hiển thị form trả lời
                <div className="mt-auto pt-4 border-t border-gray-200"> {/* Đảm bảo form trả lời luôn ở cuối */}
                  <label htmlFor="replyContent" className="block text-gray-700 text-sm font-semibold mb-2">
                    Phản hồi:
                  </label>
                  <textarea
                    id="replyContent"
                    rows={4}
                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-y"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Nhập phản hồi của bạn để gửi cho khách hàng..."
                    disabled={replyLoading}
                  ></textarea>
                  <button
                    onClick={handleReplySubmit}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                    disabled={replyLoading}
                  >
                    {replyLoading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : null}
                    {replyLoading ? 'Đang gửi...' : 'Gửi Phản hồi'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedbackPage;