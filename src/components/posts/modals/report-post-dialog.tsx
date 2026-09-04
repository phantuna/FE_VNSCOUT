import { useState } from "react"
import { Loader2, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface ReportPostDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (reason: string) => void
  isSubmitting: boolean
}

export function ReportPostDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting
}: ReportPostDialogProps) {
  const [reportReason, setReportReason] = useState("")

  const handleSubmit = () => {
    onSubmit(reportReason)
    setReportReason("") // Reset after submitting
  }

  // Handle dialog close logic to clear reason if cancelled
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReportReason("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Flag className="h-5 w-5 text-rose-500" />
            Báo cáo bài viết
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-500 mb-3">
            Vui lòng cho chúng tôi biết lý do bạn báo cáo bài viết này (Ví dụ: Spam, nội dung nhạy cảm, vi phạm bản quyền...)
          </p>
          <Textarea
            placeholder="Nhập lý do báo cáo..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="min-h-[120px] resize-none focus-visible:ring-rose-500"
          />
        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Hủy</Button>
          <Button
            variant="default"
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={handleSubmit}
            disabled={isSubmitting || !reportReason.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
