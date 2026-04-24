import * as React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  FileEdit, 
  Trash2,
  Eye,
  Pause,
  Play,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import EquipmentForm from '@/components/forms/EquipmentForm';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Equipment } from '@/types';
import { useAuth } from '@/lib/AuthContext';

export default function Inventory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [equipmentList, setEquipmentList] = React.useState<Equipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingEquipment, setEditingEquipment] = React.useState<Equipment | undefined>(undefined);
  const [equipmentToDelete, setEquipmentToDelete] = React.useState<Equipment | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  const handleTogglePause = async (eq: Equipment) => {
    if (eq.status === 'paused') {
      // If already paused, navigate to life cycle to perform maintenance and resume
      navigate(`/equipment/${eq.id}?action=resume`);
      return;
    }

    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'equipment', eq.id), { 
        status: 'paused',
        pauseStartDate: now
      });
      
      // Create a pending maintenance report/task automatically
      await addDoc(collection(db, 'reports'), {
        equipmentId: eq.id,
        equipmentName: eq.name,
        type: 'corrective',
        status: 'pending',
        date: now.split('T')[0],
        description: 'Equipo pausado manualmente. Requiere revisión técnica para reanudar.',
        technicianId: user?.uid || 'system',
        createdAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error('Error toggling pause:', error);
      alert(`Error al cambiar estado: ${error.message || 'Permisos insuficientes'}`);
    }
  };

  const handleDelete = async () => {
    if (!equipmentToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'equipment', equipmentToDelete.id));
      setEquipmentToDelete(null);
    } catch (error: any) {
      console.error('Error deleting equipment:', error);
      alert(`Error al eliminar: ${error.message || 'Permisos insuficientes'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (showForm) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 border-b pb-6">
          <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingEquipment(undefined); }} className="rounded-full hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {editingEquipment ? 'Editar Equipo' : 'Nuevo Equipo'}
            </h1>
            <p className="text-slate-500">Complete la información técnica para el registro.</p>
          </div>
        </div>
        <EquipmentForm 
          initialData={editingEquipment} 
          onCancel={() => { setShowForm(false); setEditingEquipment(undefined); }} 
        />
      </div>
    );
  }

  const filteredEquipment = equipmentList.filter(eq => 
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Inventario</h1>
          <p className="text-lg text-slate-500 mt-2">
            Gestión centralizada y control de activos tecnológicos biomédicos.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl px-6 shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="mr-2 h-5 w-5" />
          Registrar Equipo
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Buscar por nombre, marca, modelo, serial o activo fijo..." 
            className="pl-12 h-12 rounded-xl border-slate-200 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-slate-500 font-medium">Cargando inventario...</p>
          </div>
        ) : filteredEquipment.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Equipo</TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Marca</TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Modelo</TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Serial / AF</TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Servicio</TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Estado</TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Próx. Manto.</TableHead>
                <TableHead className="px-6 py-4 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.map((eq) => (
                <TableRow key={eq.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                  <TableCell className="px-6 py-5 font-bold text-slate-900">{eq.name}</TableCell>
                  <TableCell className="px-6 py-5 text-slate-600 font-medium">{eq.brand}</TableCell>
                  <TableCell className="px-6 py-5 text-slate-600 font-medium">{eq.model}</TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="space-y-0.5">
                      <p className={cn("text-sm font-bold", eq.temporarySerial ? "text-amber-600" : "text-slate-900")}>
                        {eq.serial}
                        {eq.temporarySerial && (
                          <span className="ml-1 text-slate-400 font-medium">
                            ({eq.temporarySerial})
                          </span>
                        )}
                        {eq.temporarySerial && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-100 text-[8px] font-black uppercase text-amber-700">
                            Temporal
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{eq.assetNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 rounded-lg">
                      {eq.serviceName}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <Badge 
                      variant={
                        eq.status === 'active' ? 'default' : 
                        eq.status === 'maintenance' ? 'secondary' : 
                        eq.status === 'paused' ? 'outline' : 'destructive'
                      }
                      className={cn(
                        "rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                        eq.status === 'active' && "bg-emerald-500 hover:bg-emerald-600",
                        eq.status === 'paused' && "border-amber-500 text-amber-600 bg-amber-50"
                      )}
                    >
                      {eq.status === 'active' ? 'Operativo' : 
                       eq.status === 'maintenance' ? 'En Manto.' : 
                       eq.status === 'paused' ? 'En Pausa' : 'Fuera de Serv.'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs">{eq.nextMaintenance}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={cn(
                        "hover:bg-slate-100 text-slate-400 hover:text-slate-900 size-10 inline-flex items-center justify-center rounded-xl transition-all outline-none",
                        "focus-visible:ring-2 focus-visible:ring-primary/20"
                      )}>
                        <MoreVertical className="h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl p-2 shadow-xl border-slate-100">
                        <DropdownMenuItem onClick={() => navigate(`/equipment/${eq.id}`)} className="rounded-lg py-2.5 cursor-pointer">
                          <Eye className="mr-3 h-4 w-4 text-slate-400" /> Ver Hoja de Vida
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditingEquipment(eq); setShowForm(true); }} className="rounded-lg py-2.5 cursor-pointer">
                          <FileEdit className="mr-3 h-4 w-4 text-slate-400" /> Editar Datos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePause(eq)} className="rounded-lg py-2.5 cursor-pointer">
                          {eq.status === 'paused' ? (
                            <><Play className="mr-3 h-4 w-4 text-emerald-500" /> Reanudar Operación</>
                          ) : (
                            <><Pause className="mr-3 h-4 w-4 text-amber-500" /> Pausar Equipo</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2 bg-slate-100" />
                        <DropdownMenuItem onClick={() => setEquipmentToDelete(eq)} className="text-destructive rounded-lg py-2.5 cursor-pointer hover:bg-destructive/5">
                          <Trash2 className="mr-3 h-4 w-4" /> Eliminar Registro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
            <div className="bg-slate-50 p-6 rounded-full">
              <AlertTriangle className="h-12 w-12 text-slate-300" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-900">No se encontraron equipos</p>
              <p className="text-slate-500">Intente ajustar los filtros o registre un nuevo equipo para comenzar.</p>
            </div>
            <Button onClick={() => setShowForm(true)} variant="outline" className="mt-2 rounded-xl">
              Registrar Primer Equipo
            </Button>
          </div>
        )}
      </div>
      <Dialog open={!!equipmentToDelete} onOpenChange={(open) => !open && setEquipmentToDelete(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-red-600">¿Eliminar Equipo?</DialogTitle>
            <DialogDescription className="font-medium">
              Esta acción no se puede deshacer. Se eliminará permanentemente el equipo 
              <span className="font-bold text-slate-900"> {equipmentToDelete?.name}</span> con serial 
              <span className="font-bold text-slate-900"> {equipmentToDelete?.serial}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              className="rounded-xl font-bold" 
              onClick={() => setEquipmentToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              className="rounded-xl font-bold" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</>
              ) : (
                <><Trash2 className="mr-2 h-4 w-4" /> Confirmar Eliminación</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
