import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

const mockOrder = {
  orderNo: 'GD-20260311-0001',
  sku: 'TRIE-TS-2522-WH',
  style: '圆领T',
  color: '白色',
  material: '280G 重磅棉',
  resolution: '300DPI',
  delivery: '48 小时生产',
  receiver: '张三',
  phone: '13800000000',
  address: '上海市徐汇区衡山路 100 号 3 楼',
  sizes: {
    小: 6,
    中: 10,
    大: 12,
    加大: 8,
    特大: 4,
  },
  printPositions: ['前', '后', '侧'],
  printSize: '30×40 厘米',
  designPreviewUrl: '/mockups/front.jpg',
  designDownloadUrl: 'https://example.com/print-assets/transparent-design.png',
  notes: '对齐胸前安全区，避免袖口与缝线。',
};

type PreviewType = 'garment' | 'print' | null;

type PdfUrls = {
  garment?: string;
  print?: string;
};

const buildPdf = async (element: HTMLElement, filename: string) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#FFFFFF',
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let imgWidth = pageWidth;
  let imgHeight = (canvas.height * pageWidth) / canvas.width;
  if (imgHeight > pageHeight) {
    imgHeight = pageHeight;
    imgWidth = (canvas.width * pageHeight) / canvas.height;
  }

  const x = (pageWidth - imgWidth) / 2;
  const y = (pageHeight - imgHeight) / 2;

  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  pdf.save(filename);

  return url;
};

const OrderTemplate: React.FC<{
  type: 'garment' | 'print';
  qrDataUrl: string;
}> = ({ type, qrDataUrl }) => {
  const sizes = Object.entries(mockOrder.sizes);

  return (
    <div
      className="bg-white text-black"
      style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX }}
    >
      <div className="p-10 h-full flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {type === 'garment' ? 'Garment_Order' : 'Print_Order'}
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">订单号：{mockOrder.orderNo}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">SKU</p>
            <p className="text-sm font-bold">{mockOrder.sku}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border border-black/10 rounded-lg p-3">
            <p className="text-[10px] font-mono text-zinc-500">产品信息</p>
            <p className="font-semibold">{mockOrder.style} / {mockOrder.color}</p>
            <p className="text-xs text-zinc-500">{mockOrder.material}</p>
            <p className="text-xs text-zinc-500">分辨率：{mockOrder.resolution}</p>
          </div>
          <div className="border border-black/10 rounded-lg p-3">
            <p className="text-[10px] font-mono text-zinc-500">收件信息</p>
            <p className="font-semibold">{mockOrder.receiver} · {mockOrder.phone}</p>
            <p className="text-xs text-zinc-500">{mockOrder.address}</p>
          </div>
        </div>

        {type === 'garment' && (
          <div className="border border-black/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-zinc-500">尺码汇总矩阵</p>
              <p className="text-xs text-zinc-500">交付：{mockOrder.delivery}</p>
            </div>
            <div className="grid grid-cols-5 gap-2 mt-3">
              {sizes.map(([size, qty]) => (
                <div key={size} className="border border-black/10 rounded-md p-2 text-center">
                  <p className="text-xs font-semibold">{size}</p>
                  <p className="text-sm font-bold">{qty}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === 'print' && (
          <div className="border border-black/10 rounded-lg p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-zinc-500">印花位置</p>
                <p className="text-sm font-semibold">{mockOrder.printPositions.join(' / ')}</p>
                <p className="text-xs text-zinc-500">物理尺寸：{mockOrder.printSize}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-zinc-500">原图下载</p>
                <img src={qrDataUrl} alt="二维码" className="w-16 h-16" />
              </div>
            </div>
            <div className="border border-dashed border-black/20 rounded-lg p-4">
              <p className="text-[10px] font-mono text-zinc-500">尺寸参考图</p>
              <div className="mt-2 h-40 border border-black/10 rounded-md flex items-center justify-center">
                <span className="text-xs text-zinc-400">示意图（前/后/侧位置）</span>
              </div>
            </div>
            <div className="text-xs text-zinc-500">备注：{mockOrder.notes}</div>
          </div>
        )}

        <div className="mt-auto text-xs text-zinc-400">
          TRIE 生产系统 · 自动生成
        </div>
      </div>
    </div>
  );
};

const Checkout: React.FC = () => {
  const garmentRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [preview, setPreview] = useState<PreviewType>(null);
  const [pdfUrls, setPdfUrls] = useState<PdfUrls>({});

  useEffect(() => {
    QRCode.toDataURL(mockOrder.designDownloadUrl, { width: 160, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, []);

  const handleExportAll = async () => {
    if (!garmentRef.current || !printRef.current) return;
    setIsExporting(true);
    try {
      const garmentUrl = await buildPdf(garmentRef.current, `Garment_Order_${mockOrder.orderNo}.pdf`);
      const printUrl = await buildPdf(printRef.current, `Print_Order_${mockOrder.orderNo}.pdf`);
      setPdfUrls({ garment: garmentUrl, print: printUrl });
    } finally {
      setIsExporting(false);
    }
  };

  const openPreview = async (type: PreviewType) => {
    if (!type) return;
    if (type === 'garment' && !pdfUrls.garment && garmentRef.current) {
      const url = await buildPdf(garmentRef.current, `Garment_Order_${mockOrder.orderNo}.pdf`);
      setPdfUrls((prev) => ({ ...prev, garment: url }));
    }
    if (type === 'print' && !pdfUrls.print && printRef.current) {
      const url = await buildPdf(printRef.current, `Print_Order_${mockOrder.orderNo}.pdf`);
      setPdfUrls((prev) => ({ ...prev, print: url }));
    }
    setPreview(type);
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h2 className="text-3xl font-black italic">最终规格</h2>
        <p className="text-xs text-zinc-500 font-mono tracking-widest">工业级参数</p>
        <p className="text-[10px] font-mono text-zinc-500">生产单据：结算后自动生成</p>
      </div>

      <div className="glass p-6 rounded-3xl border border-black/10 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500">版本</span>
            <p className="font-bold">核心型号 2522</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500">面料</span>
            <p className="font-bold">280G 重磅棉</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500">分辨率</span>
            <p className="font-bold text-[#0057FF]">300 分辨率 / 无损</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500">预计交付</span>
            <p className="font-bold">48 小时生产</p>
          </div>
        </div>

        <div className="pt-6 border-t border-black/10 space-y-4">
          <p className="text-[10px] font-mono text-zinc-500">尺码选择</p>
          <div className="flex gap-2">
            {['小', '中', '大', '加大', '特大'].map(size => (
              <button key={size} className="w-10 h-10 border border-black/10 flex items-center justify-center text-xs font-bold hover:border-[#0057FF] hover:text-[#0057FF] transition-colors">{size}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end p-2 border-b border-black/10">
          <span className="text-zinc-500 text-sm">设计费用（智能）</span>
          <span className="font-mono text-sm">¥0.00（会员专享）</span>
        </div>
        <div className="flex justify-between items-end p-2 border-b border-black/10">
          <span className="text-zinc-500 text-sm">产品费用</span>
          <span className="font-mono text-sm">¥199.00</span>
        </div>
        <div className="flex justify-between items-end p-4 bg-[#0057FF] rounded-xl text-white">
          <span className="font-black">合计</span>
          <span className="text-2xl font-black italic">¥199.00</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => openPreview('garment')}
          className="w-full py-3 bg-white text-black font-bold text-sm rounded-xl border border-black/10 hover:border-[#0057FF] hover:text-[#0057FF] transition-all"
        >
          查看底衫生产单
        </button>
        <button
          onClick={() => openPreview('print')}
          className="w-full py-3 bg-white text-black font-bold text-sm rounded-xl border border-black/10 hover:border-[#0057FF] hover:text-[#0057FF] transition-all"
        >
          查看印花生产单
        </button>
      </div>

      <button
        onClick={handleExportAll}
        disabled={isExporting}
        className="w-full py-5 bg-white text-black font-black text-xl rounded-full shadow-2xl hover:bg-[#0057FF] hover:text-white transition-all transform active:scale-95 disabled:opacity-50"
      >
        {isExporting ? '生成中…' : '完成支付并导出生产单'}
      </button>

      <p className="text-center text-[10px] font-mono text-zinc-600">
        情绪引擎 版本 1.2.5 <br/>
        版权归属 2024
      </p>

      {preview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-black/10 px-4 py-3 flex justify-between items-center">
              <span className="font-bold">
                {preview === 'garment' ? '底衫生产单预览' : '印花生产单预览'}
              </span>
              <button onClick={() => setPreview(null)} className="text-sm text-zinc-500">关闭</button>
            </div>
            <div className="p-4 flex justify-center">
              <div className="scale-90 origin-top">
                <OrderTemplate type={preview} qrDataUrl={qrDataUrl} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute -left-[9999px] top-0">
        <div ref={garmentRef}>
          <OrderTemplate type="garment" qrDataUrl={qrDataUrl} />
        </div>
        <div ref={printRef}>
          <OrderTemplate type="print" qrDataUrl={qrDataUrl} />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
