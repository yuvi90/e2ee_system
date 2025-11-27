// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface EncryptedFile {
  id: string;
  name: string;
  size: string;
  modified: string;
  type: string;
}

// Mock Database
const MOCK_FILES: EncryptedFile[] = [
  { id: '1', name: 'Project-Alpha-Brief.docx.enc', size: '5.2 MB', modified: 'Oct 26, 2023', type: 'docx' },
  { id: '2', name: 'Q3-Financials.xlsx.enc', size: '1.8 MB', modified: 'Oct 24, 2023', type: 'xlsx' },
  { id: '3', name: 'Website-Mockups-v2.zip.enc', size: '128.4 MB', modified: 'Oct 22, 2023', type: 'zip' },
  { id: '4', name: 'Team-Meeting-Notes.pdf.enc', size: '850 KB', modified: 'Oct 21, 2023', type: 'pdf' },
  { id: '5', name: 'Product-Roadmap.pptx.enc', size: '3.1 MB', modified: 'Oct 20, 2023', type: 'pptx' },
  { id: '6', name: 'Legal-Contracts-2023.pdf.enc', size: '4.2 MB', modified: 'Oct 19, 2023', type: 'pdf' },
  { id: '7', name: 'Source-Code-Backup.tar.gz.enc', size: '450 MB', modified: 'Oct 18, 2023', type: 'zip' },
];

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      await delay(1500);
      // Simulate random server error (reduced probability for smoother demo)
      if (Math.random() < 0.05) throw new Error("Server unavailable");
      
      if (email && password.length >= 8) {
        // SIMULATION: 'unverified@example.com' will return an unverified user
        const isVerified = email !== 'unverified@example.com';

        return { 
          token: "mock_jwt_token", 
          user: { 
            email, 
            name: isVerified ? "Jane Doe" : "Unverified User",
            isVerified: isVerified
          } 
        };
      }
      throw new Error("Invalid credentials");
    },
    register: async (data: any) => {
      await delay(2000);
      return { success: true, userId: "user_123" };
    },
    verify: async (token: string) => {
        await delay(1000);
        return { success: true };
    }
  },
  files: {
    list: async () => {
      await delay(1000); 
      return MOCK_FILES;
    },
    upload: async (file: File) => {
        await delay(2000);
        return { 
            id: Math.random().toString(),
            name: `${file.name}.enc`,
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
            modified: new Date().toLocaleDateString(),
            type: 'file'
        };
    }
  }
};