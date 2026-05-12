'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Loader2, Monitor, Moon, Sun, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/features/auth/profile';

const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Hà Nội / TP. HCM (UTC+7)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Asia/Seoul', label: 'Seoul (UTC+9)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (UTC+0/+1)' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1/+2)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8/-7)' },
  { value: 'America/New_York', label: 'New York (UTC-5/-4)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10/+11)' },
] as const;

const THEMES = [
  { value: 'light' as const, label: 'Sáng', icon: Sun },
  { value: 'dark' as const, label: 'Tối', icon: Moon },
  { value: 'system' as const, label: 'Theo hệ thống', icon: Monitor },
];

type InitialProfile = {
  email: string | null;
  displayName: string | null;
  timezone: string;
  dailyNewCards: number;
  dailyReviewMax: number;
};

export function SettingsForm({ initial }: { initial: InitialProfile }) {
  const [pending, startTransition] = React.useTransition();
  const [displayName, setDisplayName] = React.useState(initial.displayName ?? '');
  const [timezone, setTimezone] = React.useState(initial.timezone);
  const [dailyNewCards, setDailyNewCards] = React.useState(initial.dailyNewCards);
  const [dailyReviewMax, setDailyReviewMax] = React.useState(initial.dailyReviewMax);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfile({
        displayName,
        timezone,
        dailyNewCards,
        dailyReviewMax,
      });
      if (result.ok) {
        toast.success('Đã lưu thay đổi.');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <SettingsSection title="Tài khoản" description="Thông tin cơ bản và múi giờ.">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={initial.email ?? ''}
            disabled
            className="font-mono text-sm text-zinc-500"
          />
          <p className="text-[11px] text-zinc-500">
            Email không thể đổi từ trang này — quản lý qua Supabase Auth.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="displayName">Tên hiển thị</Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            maxLength={100}
            placeholder="Tên hiển thị của bạn"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={pending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="timezone">Múi giờ</Label>
          <select
            id="timezone"
            name="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={pending}
            className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-zinc-500">
            Ảnh hưởng tới streak, heatmap, daily limits — tính theo nửa đêm của múi giờ này.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Giới hạn hằng ngày"
        description="Số thẻ tối đa hiển thị trong queue ôn tập hằng ngày."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dailyNewCards">Thẻ mới mỗi ngày</Label>
            <Input
              id="dailyNewCards"
              name="dailyNewCards"
              type="number"
              min={1}
              max={50}
              step={1}
              value={dailyNewCards}
              onChange={(e) => setDailyNewCards(Number(e.target.value))}
              disabled={pending}
            />
            <p className="text-[11px] text-zinc-500">1 – 50 thẻ. Mặc định 20.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dailyReviewMax">Tối đa ôn lại</Label>
            <Input
              id="dailyReviewMax"
              name="dailyReviewMax"
              type="number"
              min={50}
              max={500}
              step={10}
              value={dailyReviewMax}
              onChange={(e) => setDailyReviewMax(Number(e.target.value))}
              disabled={pending}
            />
            <p className="text-[11px] text-zinc-500">50 – 500 thẻ. Mặc định 200.</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Giao diện"
        description="Chế độ sáng / tối — lưu cục bộ trên trình duyệt."
      >
        <ThemeRadio />
      </SettingsSection>

      <div className="flex items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
        <span className="text-xs text-zinc-500">
          Thay đổi múi giờ / giới hạn áp dụng ngay từ lần ôn kế tiếp.
        </span>
      </div>
    </form>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ThemeRadio() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current = mounted ? (theme ?? 'system') : 'system';

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {THEMES.map(({ value, label, icon: Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
              active
                ? 'border-sky-300 bg-sky-50 text-sky-900 ring-1 ring-sky-200 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-800'
                : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
