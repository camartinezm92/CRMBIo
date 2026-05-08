import * as React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Stethoscope, 
  Building2, 
  Wrench, 
  ClipboardCheck,
  ShieldCheck,
  Search,
  Loader2,
  ArrowLeft,
  Settings2,
  FileSpreadsheet
} from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Equipment, Service } from '@/types';
import EquipmentForm from '@/components/forms/EquipmentForm';
import MaintenanceForm from '@/components/forms/MaintenanceForm';
import { CalibrationForm } from '@/components/forms/CalibrationForm';
import { ExternalMaintenanceForm } from '@/components/forms/ExternalMaintenanceForm';
import GOServiceForm from '@/components/forms/GOServiceForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormType = 'equipment' | 'service' | 'preventive' | 'corrective' | 'calibration' | 'go_service' | null;

export default function Forms() {
  const [activeForm, setActiveForm] = React.useState<FormType>(null);
  const [showExtraForms, setShowExtraForms] = React.useState(false);
  const [equipmentList, setEquipmentList] = React.useState<Equipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedEquipment, setSelectedEquipment] = React.useState<Equipment | null>(null);
  const [maintenanceMode, setMaintenanceMode] = React.useState<'manual' | 'external' | null>(null);
  const [newServiceName, setNewServiceName] = React.useState('');
  const [savingService, setSavingService] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'equipment'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Equipment[];
      setEquipmentList(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredEquipment = equipmentList.filter(eq => 
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.assetNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddService = async () => {
    if (!newServiceName.trim()) return;
    setSavingService(true);
    try {
      await addDoc(collection(db, 'services'), {
        name: newServiceName,
        createdAt: serverTimestamp()
      });
      setNewServiceName('');
      setActiveForm(null);
      alert('Servicio añadido exitosamente.');
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Error al añadir el servicio.');
    } finally {
      setSavingService(false);
    }
  };

  const formActions = [
    {
      id: 'equipment' as const,
      title: 'Nuevo Equipo',
      description: 'Registra un nuevo equipo biomédico en el inventario.',
      icon: Stethoscope,
      color: 'bg-blue-100 text-blue-600',
      action: 'Crear'
    },
    {
      id: 'service' as const,
      title: 'Nuevo Servicio',
      description: 'Añade una nueva área o servicio institucional.',
      icon: Building2,
      color: 'bg-green-100 text-green-600',
      action: 'Añadir'
    },
    {
      id: 'preventive' as const,
      title: 'Mantenimiento Preventivo',
      description: 'Genera un reporte de mantenimiento programado.',
      icon: ClipboardCheck,
      color: 'bg-purple-100 text-purple-600',
      action: 'Generar'
    },
    {
      id: 'corrective' as const,
      title: 'Mantenimiento Correctivo',
      description: 'Reporta una falla y su respectiva reparación.',
      icon: Wrench,
      color: 'bg-orange-100 text-orange-600',
      action: 'Reportar'
    },
    {
      id: 'calibration' as const,
      title: 'Registrar Calibración',
      description: 'Sube un certificado y actualiza las fechas de calibración.',
      icon: ShieldCheck,
      color: 'bg-emerald-100 text-emerald-600',
      action: 'Registrar'
    }
  ];

  if (activeForm === 'equipment') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={() => setActiveForm(null)} className="rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Formatos
        </Button>
        <EquipmentForm onCancel={() => setActiveForm(null)} />
      </div>
    );
  }

  if (activeForm === 'calibration' && selectedEquipment) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={() => setSelectedEquipment(null)} className="rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Cambiar Equipo
        </Button>
        <CalibrationForm 
          equipment={selectedEquipment} 
          onCancel={() => {
            setSelectedEquipment(null);
            setActiveForm(null);
          }} 
        />
      </div>
    );
  }

  if (activeForm === 'go_service' && selectedEquipment) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={() => setSelectedEquipment(null)} className="rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Cambiar Equipo
        </Button>
        <GOServiceForm 
          equipment={selectedEquipment} 
          onCancel={() => {
            setSelectedEquipment(null);
            setActiveForm(null);
          }} 
          onSuccess={() => {
            setSelectedEquipment(null);
            setActiveForm(null);
          }}
        />
      </div>
    );
  }

  if ((activeForm === 'preventive' || activeForm === 'corrective') && selectedEquipment) {
    if (activeForm === 'preventive' && !maintenanceMode) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900">Tipo de Registro</h2>
            <p className="text-slate-500 font-medium tracking-tight italic">
              Indique cómo desea registrar el mantenimiento para: <span className="text-indigo-600 not-italic font-bold">{selectedEquipment.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
             <Card 
               className="p-8 cursor-pointer hover:bg-slate-50 border-2 border-transparent hover:border-primary/20 transition-all rounded-3xl group shadow-sm flex flex-col items-center text-center space-y-4"
               onClick={() => setMaintenanceMode('manual')}
             >
               <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                 <ClipboardCheck className="h-10 w-10 text-primary" />
               </div>
               <div>
                 <h4 className="text-xl font-black text-slate-900">Formato Digital</h4>
                 <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                   Diligencie el formulario institucional paso a paso y genere el PDF automático.
                 </p>
               </div>
               <Button className="rounded-xl w-full font-bold">Diligenciar Manual</Button>
             </Card>

             <Card 
               className="p-8 cursor-pointer hover:bg-slate-50 border-2 border-transparent hover:border-indigo-200 transition-all rounded-3xl group shadow-sm flex flex-col items-center text-center space-y-4"
               onClick={() => setMaintenanceMode('external')}
             >
               <div className="p-4 bg-indigo-100 rounded-2xl group-hover:scale-110 transition-transform">
                 <FileSpreadsheet className="h-10 w-10 text-indigo-600" />
               </div>
               <div>
                 <h4 className="text-xl font-black text-indigo-900">Reporte Externo</h4>
                 <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                   Suba un archivo PDF entregado por un proveedor o tercero externo.
                 </p>
               </div>
               <Button variant="outline" className="rounded-xl w-full font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50">Adjuntar Informe</Button>
             </Card>
          </div>

          <Button variant="ghost" onClick={() => setSelectedEquipment(null)} className="rounded-xl font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar y volver
          </Button>
        </div>
      );
    }

    if (activeForm === 'preventive' && maintenanceMode === 'external') {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Button variant="ghost" onClick={() => setMaintenanceMode(null)} className="rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a selección de tipo
          </Button>
          <ExternalMaintenanceForm 
            equipment={selectedEquipment} 
            onCancel={() => {
              setSelectedEquipment(null);
              setMaintenanceMode(null);
              setActiveForm(null);
            }} 
          />
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={() => {
          if (activeForm === 'preventive') setMaintenanceMode(null);
          else setSelectedEquipment(null);
        }} className="rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> {activeForm === 'preventive' ? 'Volver a selección de tipo' : 'Cambiar Equipo'}
        </Button>
        <MaintenanceForm 
          equipment={selectedEquipment} 
          initialType={activeForm}
          onCancel={() => {
            setSelectedEquipment(null);
            setMaintenanceMode(null);
            setActiveForm(null);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Formatos y Acciones</h1>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-lg text-slate-500 font-medium">
            Centro de creación de registros y reportes técnicos.
          </p>
          <button 
            onClick={() => setShowExtraForms(true)} 
            className="text-primary text-sm font-bold hover:underline bg-primary/5 px-2 py-1 rounded-lg"
          >
            más...
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {formActions.map((item) => (
          <Card 
            key={item.id} 
            className="group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 border-none shadow-xl shadow-slate-100/50 rounded-3xl overflow-hidden cursor-pointer"
            onClick={() => setActiveForm(item.id)}
          >
            <CardHeader className="flex flex-row items-center gap-6 space-y-0 p-8">
              <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${item.color}`}>
                <item.icon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-bold text-slate-900">{item.title}</CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">{item.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <Button className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/10">
                <Plus className="mr-2 h-5 w-5" />
                {item.action} {item.title.split(' ')[1] || item.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Equipment Selection Dialog for Maintenance */}
      <Dialog 
        open={(activeForm === 'preventive' || activeForm === 'corrective' || activeForm === 'calibration' || activeForm === 'go_service') && !selectedEquipment} 
        onOpenChange={(open) => !open && setActiveForm(null)}
      >
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Seleccionar Equipo</DialogTitle>
            <DialogDescription className="font-medium">
              Busque el equipo para el cual desea generar el reporte o calibración.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Buscar por nombre, serial o activo fijo..." 
                className="pl-12 h-12 rounded-xl border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : filteredEquipment.length === 0 ? (
                <p className="text-center py-8 text-slate-500 font-medium">No se encontraron equipos.</p>
              ) : (
                filteredEquipment.map((eq) => (
                  <div 
                    key={eq.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-primary/20 transition-all cursor-pointer group"
                    onClick={() => setSelectedEquipment(eq)}
                  >
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{eq.name}</p>
                      <p className="text-xs text-slate-500 font-medium">Serial: {eq.serial} | Activo: {eq.assetNumber}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-xl font-bold">Seleccionar</Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Service Dialog */}
      <Dialog open={activeForm === 'service'} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Nuevo Servicio</DialogTitle>
            <DialogDescription className="font-medium">
              Ingrese el nombre del nuevo servicio o área institucional.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName" className="text-sm font-bold text-slate-700">Nombre del Servicio</Label>
              <Input 
                id="serviceName"
                placeholder="Ej: UCI Neonatal" 
                className="h-12 rounded-xl border-slate-200"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setActiveForm(null)}>
                Cancelar
              </Button>
              <Button 
                className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20"
                onClick={handleAddService}
                disabled={savingService || !newServiceName.trim()}
              >
                {savingService ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Crear Servicio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Extra Forms Selection */}
      <Dialog open={showExtraForms} onOpenChange={setShowExtraForms}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Formatos Externos y Especiales</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Formatos de terceros o registros técnicos no estandarizados institucionalmente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
            <Card 
              className="p-6 cursor-pointer hover:bg-slate-50 border-2 border-transparent hover:border-primary/20 transition-all rounded-2xl group shadow-sm"
              onClick={() => {
                setActiveForm('go_service');
                setShowExtraForms(false);
              }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-indigo-100 rounded-xl group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
                </div>
                <h4 className="font-black text-slate-900 leading-tight">GO SERVITECNICO SAS</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Formato externo para reportes de mantenimiento y calibración de terceros (GOS-TEC-001).
              </p>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:bg-slate-50 border-2 border-transparent hover:border-slate-200 transition-all rounded-2xl group opacity-50 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-slate-100 rounded-xl">
                  <Settings2 className="h-6 w-6 text-slate-400" />
                </div>
                <h4 className="font-black text-slate-400">Otros Formatos</h4>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Próximamente más formatos integrados.
              </p>
            </Card>
          </div>

          <div className="flex justify-end">
             <Button variant="ghost" onClick={() => setShowExtraForms(false)} className="rounded-xl font-bold">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
