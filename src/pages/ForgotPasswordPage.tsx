import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { PasswordRecoveryLayout } from "../components/PasswordRecoveryLayout";

export function ForgotPasswordPage() {
  const [email,setEmail]=useState(""); const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState(""); const [error,setError]=useState("");
  async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");
    try{const {data}=await api.post("/forgot-password",{email});setMessage(data.message);}
    catch(err:any){setError(err?.response?.data?.detail||"Não foi possível enviar a solicitação. Tente novamente.");}
    finally{setLoading(false)}
  }
  return <PasswordRecoveryLayout>
    <h1 className="m-0 text-2xl font-bold">Esqueci minha senha</h1>
    <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">Informe seu e-mail cadastrado. Se a conta existir, enviaremos um link seguro de recuperação.</p>
    {message ? <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">{message}</div> :
    <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-slate-700">E-mail
        <span className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-100"><Mail size={18} className="text-slate-400"/><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="min-h-11 w-full border-0 bg-transparent outline-none" placeholder="seu@email.com"/></span>
      </label>
      {error&&<p role="alert" className="m-0 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="min-h-11 rounded-lg bg-blue-700 px-4 font-bold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">{loading?"Enviando...":"Enviar link de recuperação"}</button>
    </form>}
    <Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"><ArrowLeft size={16}/>Voltar ao login</Link>
  </PasswordRecoveryLayout>;
}
