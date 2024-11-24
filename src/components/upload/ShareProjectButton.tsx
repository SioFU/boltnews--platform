import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import ProjectUploadForm from './ProjectUploadForm';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import EnhancedAuthModal from '../auth/EnhancedAuthModal';

const ShareProjectButton = () => {
  const { user } = useAuthStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      // 如果用户未登录，打开登录模态框
      setIsAuthOpen(true);
    } else {
      // 如果用户已登录，打开项目表单
      setIsUploadOpen(true);
    }
  };

  // 当用户成功登录后，AuthModal 会自动关闭
  // 我们需要监听用户状态变化，在用户登录后打开上传表单
  useEffect(() => {
    if (user && isAuthOpen) {
      setIsAuthOpen(false);
      setIsUploadOpen(true);
    }
  }, [user, isAuthOpen]);

  return (
    <>
      <Button
        onClick={handleClick}
        className="bg-primary text-white hover:bg-primary/90"
      >
        Share Your Project
      </Button>

      {/* 项目上传对话框 */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-2xl">
          <ProjectUploadForm onClose={() => setIsUploadOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* 登录模态框 */}
      <EnhancedAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
};

export default ShareProjectButton;
