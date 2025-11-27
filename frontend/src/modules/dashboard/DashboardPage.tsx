import React, { useEffect, useRef, useMemo } from "react";
import { DashboardLayout } from "./DashboardLayout";
// import { useFiles } from "../../hooks/useFiles";
import { MoreVertical, FileText, Loader2, AlertCircle } from "lucide-react";
import gsap from "gsap";

export const DashboardPage: React.FC = () => {
  // const { data: files, isLoading, isError, refetch } = useFiles();

  // Mock data for demonstration purposes
  const files = useMemo(
    () => [
      {
        id: "1",
        name: "Project-Alpha-Brief.docx.enc",
        size: "5.2 MB",
        modified: "Oct 26, 2023",
        type: "docx",
      },
      {
        id: "2",
        name: "Q3-Financials.xlsx.enc",
        size: "1.8 MB",
        modified: "Oct 24, 2023",
        type: "xlsx",
      },
      {
        id: "3",
        name: "Website-Mockups-v2.zip.enc",
        size: "128.4 MB",
        modified: "Oct 22, 2023",
        type: "zip",
      },
      {
        id: "4",
        name: "Team-Meeting-Notes.pdf.enc",
        size: "850 KB",
        modified: "Oct 21, 2023",
        type: "pdf",
      },
      {
        id: "5",
        name: "Product-Roadmap.pptx.enc",
        size: "3.1 MB",
        modified: "Oct 20, 2023",
        type: "pptx",
      },
      {
        id: "6",
        name: "Legal-Contracts-2023.pdf.enc",
        size: "4.2 MB",
        modified: "Oct 19, 2023",
        type: "pdf",
      },
      {
        id: "7",
        name: "Source-Code-Backup.tar.gz.enc",
        size: "450 MB",
        modified: "Oct 18, 2023",
        type: "zip",
      },
    ],
    []
  );
  const isLoading = false;
  const isError = false;
  const refetch = () => {
    // Mock refetch function
    console.log("Refetching files...");
  };
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (files && listRef.current) {
      gsap.fromTo(
        ".file-row",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
        }
      );
    }
  }, [files]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="h-full flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
          <p>Decrypting file list...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="h-full flex flex-col items-center justify-center text-red-400">
          <AlertCircle className="w-10 h-10 mb-4" />
          <p className="text-lg font-medium">Failed to load files</p>
          <button
            onClick={() => refetch()}
            className="mt-4 text-sm text-blue-500 hover:underline"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className="border border-slate-800 rounded-xl overflow-hidden bg-card/50"
        ref={listRef}
      >
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-slate-900/50 text-xs font-medium text-slate-400 uppercase tracking-wider">
          <div className="col-span-6 flex items-center gap-4">
            <div className="w-5 h-5 border border-slate-600 rounded flex items-center justify-center">
              <input
                type="checkbox"
                className="appearance-none bg-transparent"
              />
            </div>
            File Name
          </div>
          <div className="col-span-3">Date Modified</div>
          <div className="col-span-2">File Size</div>
          <div className="col-span-1"></div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-800/50">
          {files?.map((file) => (
            <div
              key={file.id}
              className="file-row grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/30 transition-colors group opacity-0"
            >
              <div className="col-span-6 flex items-center gap-4">
                <div className="w-5 h-5 border border-slate-700 rounded hover:border-slate-500 transition-colors cursor-pointer" />
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-slate-200 text-sm font-medium group-hover:text-white transition-colors">
                    {file.name}
                  </span>
                </div>
              </div>
              <div className="col-span-3 text-sm text-slate-400">
                {file.modified}
              </div>
              <div className="col-span-2 text-sm text-slate-400">
                {file.size}
              </div>
              <div className="col-span-1 flex justify-end">
                <button className="p-2 hover:bg-slate-700 rounded-full text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State / Filler for visual matching */}
        {files && files.length < 10 && <div className="h-32 bg-transparent" />}
      </div>
    </DashboardLayout>
  );
};
