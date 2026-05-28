import React, { useState } from 'react';
import api from '../services/api';

function FileUpload({ taskId, onUploadComplete }) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFile = async (file) => {
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        setUploading(true);
        try {
            const response = await api.post(`/upload/task/${taskId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUploadComplete(response.data);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div style={styles.container}>
            <div 
                style={{
                    ...styles.dropZone,
                    ...(dragActive ? styles.dragActive : {}),
                    ...(uploading ? styles.uploading : {})
                }}
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="fileInput"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files[0])}
                    disabled={uploading}
                />
                <label htmlFor="fileInput" style={styles.label}>
                    {uploading ? (
                        <span>📤 Uploading...</span>
                    ) : (
                        <span>📎 Click or drag file to attach</span>
                    )}
                </label>
            </div>
        </div>
    );
}

const styles = {
    container: {
        marginTop: '10px'
    },
    dropZone: {
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '15px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    dragActive: {
        borderColor: '#667eea',
        background: '#f0f0ff'
    },
    uploading: {
        opacity: 0.5,
        cursor: 'wait'
    },
    label: {
        cursor: 'pointer',
        color: '#666'
    }
};

export default FileUpload;