import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAnalyticsData, TimeFilter } from '@/hooks/useAnalyticsData';
import { Eye, Users, MousePointer, TrendingUp, Loader2, CalendarIcon, Monitor, Smartphone, Tablet } from 'lucide-react';
import { format, eachHourOfInterval, eachDayOfInterval, startOfDay, startOfWeek, startOfMonth, subHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

const timeFilters: { value: TimeFilter; label: string }[] = [
  { value: 'hour', label: 'Última hora' },
  { value: 'day', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'custom', label: 'Personalizado' },
];

const sectionLabels: Record<string, string> = {
  hero: 'Hero',
  services: 'Servicios',
  products: 'Productos',
  courses: 'Cursos',
  contact: 'Contacto',
  gallery: 'Galería',
  testimonials: 'Testimonios',
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const DeviceIcon = ({ device }: { device: string }) => {
  switch (device) {
    case 'mobile':
      return <Smartphone className="w-4 h-4" />;
    case 'tablet':
      return <Tablet className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
  }
};

export const AnalyticsDashboard = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('day');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const {
    pageViews,
    uniqueVisitors,
    totalClicks,
    engagementRate,
    deviceBreakdown,
    sectionBreakdown,
    detailedClicks,
    isLoading,
  } = useAnalyticsData({
    timeFilter,
    startDate,
    endDate,
  });

  // Prepare chart data for visits over time
  const visitsChartData = useMemo(() => {
    if (pageViews.length === 0) return [];

    const now = new Date();
    let intervals: Date[];
    let formatStr: string;

    switch (timeFilter) {
      case 'hour':
        intervals = eachHourOfInterval({ start: subHours(now, 1), end: now });
        formatStr = 'HH:mm';
        break;
      case 'day':
        intervals = eachHourOfInterval({ start: startOfDay(now), end: now });
        formatStr = 'HH:mm';
        break;
      case 'week':
        intervals = eachDayOfInterval({ start: startOfWeek(now, { weekStartsOn: 1 }), end: now });
        formatStr = 'EEE';
        break;
      case 'month':
        intervals = eachDayOfInterval({ start: startOfMonth(now), end: now });
        formatStr = 'dd MMM';
        break;
      default:
        if (startDate && endDate) {
          intervals = eachDayOfInterval({ start: startDate, end: endDate });
          formatStr = 'dd MMM';
        } else {
          intervals = [];
          formatStr = 'dd MMM';
        }
    }

    return intervals.map((interval) => {
      const count = pageViews.filter((pv) => {
        const pvDate = new Date(pv.created_at);
        if (timeFilter === 'hour' || timeFilter === 'day') {
          return pvDate.getHours() === interval.getHours() && pvDate.getDate() === interval.getDate();
        }
        return pvDate.toDateString() === interval.toDateString();
      }).length;

      return {
        time: format(interval, formatStr, { locale: es }),
        visitas: count,
      };
    });
  }, [pageViews, timeFilter, startDate, endDate]);

  // Prepare section chart data
  const sectionChartData = useMemo(() => {
    return Object.entries(sectionBreakdown)
      .map(([section, count]) => ({
        section: sectionLabels[section] || section,
        clicks: count,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 6);
  }, [sectionBreakdown]);

  // Prepare device chart data
  const deviceChartData = useMemo(() => {
    const total = Object.values(deviceBreakdown).reduce((a, b) => a + b, 0);
    return Object.entries(deviceBreakdown).map(([device, count]) => ({
      name: device === 'desktop' ? 'Escritorio' : device === 'mobile' ? 'Móvil' : 'Tablet',
      value: count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
    }));
  }, [deviceBreakdown]);

  // Prepare detailed clicks table data
  const detailedClicksData = useMemo(() => {
    return Object.entries(detailedClicks)
      .map(([key, count]) => {
        const [section, elementType, elementLabel] = key.split('|');
        return {
          section: sectionLabels[section] || section,
          elementType,
          elementLabel,
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [detailedClicks]);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📊 Analytics de Landing</h2>
          <p className="text-muted-foreground">Métricas de visitas y engagement</p>
        </div>

        {/* Time Filters */}
        <div className="flex flex-wrap gap-2">
          {timeFilters.map((filter) => (
            <div key={filter.value}>
              {filter.value === 'custom' ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={timeFilter === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      className="gap-2"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      {timeFilter === 'custom' && startDate && endDate
                        ? `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`
                        : filter.label}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Fecha inicio</p>
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date);
                            if (date) setTimeFilter('custom');
                          }}
                          disabled={(date) => date > new Date()}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Fecha fin</p>
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date);
                            if (date) setTimeFilter('custom');
                          }}
                          disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button
                  variant={timeFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitas</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Eye className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pageViews.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total de vistas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Únicos</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <Users className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{uniqueVisitors}</div>
            <p className="text-xs text-muted-foreground mt-1">Visitantes únicos</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clicks</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <MousePointer className="w-5 h-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground mt-1">Interacciones totales</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{engagementRate}</div>
            <p className="text-xs text-muted-foreground mt-1">Clicks por visita</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Visits Over Time */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">📈 Visitas por Tiempo</CardTitle>
          </CardHeader>
          <CardContent>
            {visitsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={visitsChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="visitas"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay datos para mostrar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">📱 Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceChartData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={false}
                    >
                      {deviceChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {deviceChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <DeviceIcon device={item.name.toLowerCase()} />
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm font-bold ml-auto">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No hay datos para mostrar
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Sections */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">🏆 Top Secciones</CardTitle>
          </CardHeader>
          <CardContent>
            {sectionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sectionChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis
                    dataKey="section"
                    type="category"
                    width={80}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay clicks registrados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Clicks Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">📋 Detalle de Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            {detailedClicksData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sección</TableHead>
                    <TableHead>Elemento</TableHead>
                    <TableHead>Etiqueta</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedClicksData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.section}</TableCell>
                      <TableCell>{row.elementType}</TableCell>
                      <TableCell className="truncate max-w-[120px]">{row.elementLabel}</TableCell>
                      <TableCell className="text-right font-bold">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No hay clicks registrados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
