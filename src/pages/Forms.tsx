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
  ArrowLeft
} from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Equipment, Service } from '@/types';
import EquipmentForm from '@/components/forms/EquipmentForm';
import MaintenanceForm from '@/components/forms/MaintenanceForm';
import { CalibrationForm } from '@/components/forms/CalibrationForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormType = 'equipment' | 'service' | 'preventive' | 'corrective' | 'calibration' | null;

export default function Forms() {
  const [activeForm, setActiveForm] = React.useState<FormType>(null);
  const [equipmentList, setEquipmentList] = React.useState<Equipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedEquipment, setSelectedEquipment] = React.useState<Equipment | null>(null);
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

  if ((activeForm === 'preventive' || activeForm === 'corrective') && selectedEquipment) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={() => setSelectedEquipment(null)} className="rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Cambiar Equipo
        </Button>
        <MaintenanceForm 
          equipment={selectedEquipment} 
          initialType={activeForm}
          onCancel={() => {
            setSelectedEquipment(null);
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
        <p className="text-lg text-slate-500 mt-2 font-medium">
          Centro de creación de registros y reportes técnicos.
        </p>
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
        open={(activeForm === 'preventive' || activeForm === 'corrective' || activeForm === 'calibration') && !selectedEquipment} 
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
    </div>
  );
}
