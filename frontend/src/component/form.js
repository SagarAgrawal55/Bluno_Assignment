import React, { useState, useRef, useEffect } from 'react';

export default function UserApplicationForm({ onSuccess, onCancel, mail }) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: mail || "", 
        phoneNumber: "",
        documentType: "Driving Licence"
    });
    
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    
   
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    
    
    const [documentFile, setDocumentFile] = useState(null);
    const [documentPreview, setDocumentPreview] = useState(null);
    const fileInputRef = useRef(null);

    
    const validateForm = () => {
        const newErrors = {};
       
        if (!formData.fullName.trim()) {
            newErrors.fullName = "Name is required";
        }
     
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        }
        
    
        const phoneRegex = /^\d{10}$/;
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required";
        } else if (!phoneRegex.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "Please enter a valid 10-digit phone number";
        }
    
        if (!capturedImage) {
            newErrors.selfie = "Please capture a selfie";
        }
        
      
        if (!documentFile) {
            newErrors.document = "Please upload a proof of address document";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }
    };


    useEffect(() => {
        if (mail) {
            setFormData(prevData => ({
                ...prevData,
                email: mail
            }));
        }
    }, [mail]);

    
    const openCamera = async () => {
        try {
            setCameraError(null);
            
       
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            
            
            setIsCameraOpen(true);
            

            setTimeout(async () => {
                try {
               
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { 
                            facingMode: "user",
                            width: { ideal: 640 },
                            height: { ideal: 480 } 
                        },
                        audio: false
                    });
                    
                  
                    streamRef.current = stream;
                    
                   
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        
                       
                        try {
                            await videoRef.current.play();
                        } catch (playErr) {
                            console.error("Error playing video:", playErr);
                        }
                    } else {
                        console.error("Video element still not available after delay");
                        setCameraError("Camera initialization failed. Please try again.");
                        setIsCameraOpen(false);
                    }
                } catch (streamErr) {
                    console.error("Error getting camera stream:", streamErr);
                    setCameraError("Unable to access camera. Please ensure camera permissions are granted.");
                    setIsCameraOpen(false);
                }
            }, 300);
        } catch (err) {
            console.error("Error in camera initialization:", err);
            setCameraError("Unable to access camera. Please ensure camera permissions are granted.");
            setIsCameraOpen(false);
        }
    };
    
    const closeCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        setIsCameraOpen(false);
    };
    
   
    const captureImage = () => {
        if (!videoRef.current || !streamRef.current) {
            setCameraError("Camera not ready. Please try again.");
            return;
        }
        
        try {
           
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
          
            const videoWidth = videoRef.current.videoWidth || 640;
            const videoHeight = videoRef.current.videoHeight || 480;
            
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            
          
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            
          
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
          
            canvas.toBlob((blob) => {
                if (!blob) {
                    setCameraError("Failed to capture image. Please try again.");
                    return;
                }
                
                const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
                
              
                setCapturedImage({
                    file: file,
                    preview: dataUrl
                });
            
                closeCamera();
            }, 'image/jpeg', 0.8);
            
        } catch (err) {
            console.error("Error capturing image:", err);
            setCameraError("Failed to capture image. Please try again.");
        }
    };
    
  
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        

        const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setErrors({
                ...errors,
                document: "Please upload only PNG, JPEG or PDF files"
            });
            return;
        }
        
      
        if (file.size > 5 * 1024 * 1024) {
            setErrors({
                ...errors,
                document: "File size should be less than 5MB"
            });
            return;
        }
        
        setDocumentFile(file);
        
      
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setDocumentPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            
            setDocumentPreview(null);
        }
        
      
        if (errors.document) {
            setErrors({
                ...errors,
                document: null
            });
        }
    };
    
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        
     
        const formDataToSend = new FormData();
        formDataToSend.append('fullName', formData.fullName);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('phoneNumber', formData.phoneNumber);
        formDataToSend.append('documentType', formData.documentType);
        
      
        if (capturedImage && capturedImage.file) {
            formDataToSend.append('selfie', capturedImage.file);
        }
        if (documentFile) {
            formDataToSend.append('document', documentFile);
        }
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/applications/submit`
, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend,
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error submitting application');
            }
            
            setSuccess("Application submitted successfully!");
            setLoading(false);
            
       
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess(data.data.application);
                }, 1500);
            }
            
        } catch (error) {
            console.error("Submission error:", error);
            setErrors({
                ...errors,
                form: error.message
            });
            setLoading(false);
        }
    };
    
   
    useEffect(() => {
      
        if (isCameraOpen) {
          
            let isMounted = true;
          
            const setupVideo = () => {
                if (!isMounted) return;
                
                if (videoRef.current) {
                    const videoElement = videoRef.current;
                    
                  
                    if (videoElement.srcObject && videoElement.srcObject !== streamRef.current) {
                        videoElement.srcObject = null;
                    }
                    
                
                    const handleVideoReady = () => {
                        if (!isMounted) return;
                        
                        videoElement.play().catch(err => {
                            console.error("Error playing video:", err);
                            if (isMounted) {
                                setCameraError("Error displaying camera feed. Please reload and try again.");
                            }
                        });
                    };
                    
                    const handleCanPlay = () => {
                        console.log("Video can play now");
                    };
                    
                 
                    videoElement.addEventListener('loadedmetadata', handleVideoReady);
                    videoElement.addEventListener('canplay', handleCanPlay);
                    
                 
                    if (videoElement.readyState >= 2) {
                        handleVideoReady();
                    }
                    
                  
                    return () => {
                        videoElement.removeEventListener('loadedmetadata', handleVideoReady);
                        videoElement.removeEventListener('canplay', handleCanPlay);
                    };
                } else {
                   
                    const timerId = setTimeout(setupVideo, 100);
                    return () => clearTimeout(timerId);
                }
            };
            
           
            const cleanup = setupVideo();
            

            return () => {
                isMounted = false;
                if (cleanup) cleanup();
            };
        }
    }, [isCameraOpen]);
    
    useEffect(() => {
        let isMounted = true;
        
        return () => {
            isMounted = false;
            
         
            if (streamRef.current) {
                try {
                    streamRef.current.getTracks().forEach(track => track.stop());
                } catch (err) {
                    console.error("Error stopping camera tracks:", err);
                }
                streamRef.current = null;
            }
            
          
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            
           
            setIsCameraOpen(false);
        };
    }, []);

    return (
        <div className="p-6 max-h-[80vh] overflow-y-auto">
            {/* Application Form */}
            <div className="space-y-4">
                {/* Personal Information */}
                <div className="relative group">
                    <input
                        required
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        placeholder="Full Name"
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full bg-blue-50 text-blue-800 py-3 px-4 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 placeholder-blue-400 disabled:opacity-60"
                    />
                    {errors.fullName && (
                        <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                    )}
                </div>

                <div className="relative group">
                    <input
                        required
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        placeholder="Email Address"
                        onChange={handleChange}
                        disabled={true} 
                        readOnly
                        className="w-full bg-gray-100 text-blue-800 py-3 px-4 rounded-lg border border-blue-200 focus:outline-none transition-all duration-300 placeholder-blue-400 disabled:opacity-60"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                </div>

                <div className="relative group">
                    <input
                        required
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        placeholder="Phone Number (10 digits)"
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full bg-blue-50 text-blue-800 py-3 px-4 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 placeholder-blue-400 disabled:opacity-60"
                    />
                    {errors.phoneNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                    )}
                </div>

                {/* Selfie Capture */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <h3 className="text-blue-800 text-lg mb-2">Selfie Capture</h3>
                    
                    {isCameraOpen ? (
                        <div className="space-y-3">
                            <div className="relative bg-black rounded-lg overflow-hidden w-full h-64">
                               
                                <video 
                                    key={`camera-${Date.now()}`}
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline
                                    muted
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{ transform: 'scaleX(-1)' }} 
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={captureImage}
                                    className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg py-2 text-white font-medium transition-all duration-300"
                                >
                                    Capture
                                </button>
                                <button
                                    type="button"
                                    onClick={closeCamera}
                                    className="flex-1 bg-blue-200 hover:bg-blue-300 rounded-lg py-2 text-blue-800 font-medium transition-all duration-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : capturedImage ? (
                        <div className="space-y-3">
                            <div className="relative bg-black rounded-lg overflow-hidden w-full h-64">
                                <img 
                                    src={capturedImage.preview} 
                                    alt="Captured selfie" 
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setCapturedImage(null);
                                    openCamera();
                                }}
                                className="w-full bg-blue-200 hover:bg-blue-300 rounded-lg py-2 text-blue-800 font-medium transition-all duration-300"
                            >
                                Retake Selfie
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-white border border-blue-200 rounded-lg flex flex-col items-center justify-center h-48">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-blue-600 text-center text-sm">No selfie captured yet</p>
                            </div>
                            <button
                                type="button"
                                onClick={openCamera}
                                className="w-full bg-blue-700 hover:bg-blue-800 rounded-lg py-2 text-white font-medium transition-all duration-300"
                            >
                                Open Camera
                            </button>
                            {cameraError && (
                                <p className="text-red-500 text-xs">{cameraError}</p>
                            )}
                            {errors.selfie && (
                                <p className="text-red-500 text-xs">{errors.selfie}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Document Type Selection */}
                <div className="relative group">
                    <label htmlFor="documentType" className="block text-blue-800 text-sm mb-1">
                        Proof of Address Document Type
                    </label>
                    <select
                        required
                        id="documentType"
                        name="documentType"
                        value={formData.documentType}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full bg-blue-50 text-blue-800 py-3 px-4 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 appearance-none disabled:opacity-60"
                    >
                        <option value="Driving Licence" className="bg-white">Driving Licence</option>
                        <option value="PAN Card" className="bg-white">PAN Card</option>
                        <option value="Aadhaar Card" className="bg-white">Aadhaar Card</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none mt-6">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>

                {/* Document Upload */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <h3 className="text-blue-800 text-lg mb-2">Upload Proof of Address</h3>
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    
                    {documentFile ? (
                        <div className="space-y-3">
                            {documentPreview ? (
                                <div className="relative bg-white rounded-lg overflow-hidden w-full h-48 border border-blue-200">
                                    <img 
                                        src={documentPreview} 
                                        alt="Document preview" 
                                        className="absolute inset-0 w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="bg-white border border-blue-200 rounded-lg flex flex-col items-center justify-center h-48">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-blue-600 text-center">{documentFile.name}</p>
                                    <p className="text-blue-500 text-center text-xs">{(documentFile.size / 1024).toFixed(2)} KB</p>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={triggerFileInput}
                                className="w-full bg-blue-200 hover:bg-blue-300 rounded-lg py-2 text-blue-800 font-medium transition-all duration-300"
                            >
                                Change Document
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div 
                                onClick={triggerFileInput}
                                className="bg-white border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center h-48 cursor-pointer hover:border-blue-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-blue-600 text-center font-medium">Click to upload document</p>
                                <p className="text-blue-500 text-center text-xs mt-1">PNG, JPEG or PDF (max. 5MB)</p>
                            </div>
                            {errors.document && (
                                <p className="text-red-500 text-xs">{errors.document}</p>
                            )}
                        </div>
                    )}
                </div>
                
                {/* General form error */}
                {errors.form && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="text-sm">{errors.form}</span>
                    </div>
                )}
                
                {/* Success message */}
                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="text-sm">{success}</span>
                    </div>
                )}

                <div className="flex space-x-4 pt-2">
                    <button
                        onClick={onCancel}
                        type="button"
                        className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors duration-300"
                    >
                        Cancel
                    </button>
                    
                    <button
                        onClick={handleSubmit}
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                            </div>
                        ) : "Submit Application"}
                    </button>
                </div>
            </div>
        </div>
    );
}