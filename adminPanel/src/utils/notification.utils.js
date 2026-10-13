import { toast } from "react-toastify"
export const generateNotification = (message) => {
    return () => toast(message, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        className: "!rounded-xl !border !border-border !bg-card !font-medium !text-foreground !shadow-xl !shadow-black/20",
        progressClassName: "!bg-primary"
    }); 
}