"use client";

import { useEffect, useRef } from "react";

export function AutoSubmitMfa(props: { action: string; next: string }) {
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={props.action} method="post">
      <input type="hidden" name="next" value={props.next} />
      <input type="hidden" name="token" value="" />
      <button type="submit" className="underline">
        Continuer
      </button>
    </form>
  );
}

