import "./CallModal.css"

const IncomingCallModal = ({ caller, onAccept, onReject }) => {
    return (
        <div className="fixed bottom-25 right-3 z-50 border rounded-md shadow-lg p-4 w-[300px] box">
            <h2 className="text-lg font-semibold mb-2 h1">
                Incoming Call 📞
            </h2>
            <p className="text-[15px] font-semibold mb-4 h2">
                {caller} is calling...
            </p>
            <div className="flex justify-end gap-3 font-semibold">
                <button onClick={onAccept} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm" >
                    Accept
                </button>
                <button onClick={onReject} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                    Reject
                </button>
            </div>
        </div>
    );
};

export default IncomingCallModal;
