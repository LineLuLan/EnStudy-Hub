'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Mail, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithMagicLink, signInWithGoogle } from '@/features/auth/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
      {pending ? 'Đang gửi…' : 'Gửi magic link'}
    </Button>
  );
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  React.useEffect(() => {
    if (initialError) toast.error(initialError);
  }, [initialError]);

  async function handleSubmit(formData: FormData) {
    const email = (formData.get('email') as string | null)?.trim();
    const result = await signInWithMagicLink(formData);
    if (result.ok) {
      setSentTo(email ?? null);
      toast.success('Đã gửi magic link. Kiểm tra email của bạn.');
    } else {
      toast.error(result.error);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const res = await signInWithGoogle();
    if (res.ok && res.data) {
      window.location.href = res.data.url;
    } else {
      toast.error(res.ok ? 'Không lấy được URL OAuth' : res.error);
      setGoogleLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-sm font-medium">Đã gửi magic link tới</p>
          <p className="font-mono text-sm">{sentTo}</p>
        </div>
        <p className="text-xs text-zinc-500">
          Mở email → click link → bạn sẽ được điều hướng về Dashboard.
        </p>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="text-xs text-zinc-500 underline"
        >
          Dùng email khác
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form action={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ban@example.com"
            autoComplete="email"
            required
          />
        </div>
        <SubmitButton />
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950">hoặc</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="h-4 w-4" />
        )}
        {googleLoading ? 'Đang chuyển hướng…' : 'Tiếp tục với Google'}
      </Button>

      <p className="text-center text-xs text-zinc-500">
        Bằng cách tiếp tục, bạn đồng ý với điều khoản sử dụng và chính sách riêng tư.
      </p>
    </div>
  );
}
