import { axiosInstance } from "../api";
import { UserFeedBack } from "../schema/validations";

interface FeedbackPayload extends UserFeedBack {
  starRating: number;
}

class FeedbackService {
  async submitFeedback(payload: FeedbackPayload): Promise<APIResponse<{}>> {
    try {
      const response = await axiosInstance.post<APIResponse<{}>>(
        "/account/feedback",
        payload,
      );
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to submit feedback";
      return { success: false, message, details: {} };
    }
  }
}

export default new FeedbackService();
